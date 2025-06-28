from flask import Blueprint, jsonify, request, session
from src.models.user import User, db
from src.models.case import Case
from src.models.document import Document
from datetime import datetime
import random

cases_bp = Blueprint('cases', __name__)

def get_current_user():
    """Helper function to get current user from session"""
    user_id = session.get('user_id')
    if not user_id:
        return None
    return User.query.get(user_id)

def assign_case_to_staff(case):
    """Auto-assign case to available staff member"""
    # Get all active staff members
    staff_members = User.query.filter_by(role='staff', is_active=True).all()
    if staff_members:
        # Simple round-robin assignment (in production, you might use more sophisticated logic)
        assigned_staff = random.choice(staff_members)
        case.assigned_staff_id = assigned_staff.id
        return assigned_staff
    return None

@cases_bp.route('/cases', methods=['GET'])
def get_cases():
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        # Filter cases based on user role
        if current_user.role == 'client':
            # Clients can only see their own cases
            cases = Case.query.filter_by(client_id=current_user.id).all()
            return jsonify([case.to_dict_client_view() for case in cases]), 200
        elif current_user.role in ['staff', 'legal', 'admin']:
            # Staff, legal, and admin can see all cases
            cases = Case.query.all()
            return jsonify([case.to_dict() for case in cases]), 200
        else:
            return jsonify({'error': 'Unauthorized'}), 403
            
    except Exception as e:
        return jsonify({'error': 'Failed to fetch cases'}), 500

@cases_bp.route('/cases', methods=['POST'])
def create_case():
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['title', 'amount_owed', 'debtor_company']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create new case
        case = Case(
            title=data['title'],
            description=data.get('description', ''),
            amount_owed=float(data['amount_owed']),
            debtor_company=data['debtor_company'],
            debtor_contact=data.get('debtor_contact'),
            client_id=current_user.id,
            priority=data.get('priority', 'Medium')
        )
        
        # Auto-assign to staff
        assigned_staff = assign_case_to_staff(case)
        
        db.session.add(case)
        db.session.commit()
        
        response_data = case.to_dict_client_view() if current_user.role == 'client' else case.to_dict()
        
        return jsonify({
            'message': 'Case created successfully',
            'case': response_data,
            'assigned_staff': assigned_staff.to_dict_safe() if assigned_staff else None
        }), 201
        
    except ValueError:
        return jsonify({'error': 'Invalid amount_owed value'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create case'}), 500

@cases_bp.route('/cases/<int:case_id>', methods=['GET'])
def get_case(case_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        case = Case.query.get_or_404(case_id)
        
        # Check permissions
        if current_user.role == 'client' and case.client_id != current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Return appropriate view based on role
        if current_user.role == 'client':
            return jsonify(case.to_dict_client_view()), 200
        else:
            return jsonify(case.to_dict()), 200
            
    except Exception as e:
        return jsonify({'error': 'Case not found'}), 404

@cases_bp.route('/cases/<int:case_id>', methods=['PUT'])
def update_case(case_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': 'Authentication required'}), 401
    
    # Only staff, legal, and admin can update cases
    if current_user.role not in ['staff', 'legal', 'admin']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        case = Case.query.get_or_404(case_id)
        data = request.json
        
        # Update allowed fields
        if 'title' in data:
            case.title = data['title']
        if 'description' in data:
            case.description = data['description']
        if 'status' in data:
            case.status = data['status']
        if 'priority' in data:
            case.priority = data['priority']
        if 'assigned_staff_id' in data:
            case.assigned_staff_id = data['assigned_staff_id']
        if 'debtor_contact' in data:
            case.debtor_contact = data['debtor_contact']
        
        case.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Case updated successfully',
            'case': case.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update case'}), 500

@cases_bp.route('/cases/<int:case_id>/documents', methods=['GET'])
def get_case_documents(case_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        case = Case.query.get_or_404(case_id)
        
        # Check permissions
        if current_user.role == 'client':
            if case.client_id != current_user.id:
                return jsonify({'error': 'Unauthorized'}), 403
            # Clients can't see documents, only that the case exists
            return jsonify({'message': 'Documents are managed by our team'}), 200
        
        # Staff, legal, and admin can see documents
        if current_user.role in ['staff', 'legal', 'admin']:
            documents = Document.query.filter_by(case_id=case_id).all()
            return jsonify([doc.to_dict() for doc in documents]), 200
        
        return jsonify({'error': 'Unauthorized'}), 403
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch documents'}), 500

@cases_bp.route('/my-cases', methods=['GET'])
def get_my_cases():
    """Get cases assigned to current user (for staff)"""
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': 'Authentication required'}), 401
    
    if current_user.role not in ['staff', 'legal']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        cases = Case.query.filter_by(assigned_staff_id=current_user.id).all()
        return jsonify([case.to_dict() for case in cases]), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch assigned cases'}), 500

