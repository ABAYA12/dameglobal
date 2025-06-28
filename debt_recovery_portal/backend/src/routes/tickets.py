from flask import Blueprint, jsonify, request, session
from src.models.user import User, db
from src.models.ticket import Ticket
from src.models.case import Case
from datetime import datetime
import random

tickets_bp = Blueprint('tickets', __name__)

def get_current_user():
    """Helper function to get current user from session"""
    user_id = session.get('user_id')
    if not user_id:
        return None
    return User.query.get(user_id)

def auto_assign_ticket(ticket):
    """Auto-assign ticket to available staff member"""
    # Get all active staff members
    staff_members = User.query.filter_by(role='staff', is_active=True).all()
    if staff_members:
        # Simple round-robin assignment
        assigned_staff = random.choice(staff_members)
        ticket.assigned_to_id = assigned_staff.id
        return assigned_staff
    return None

def categorize_ticket(title, description):
    """Simple AI-powered categorization (placeholder)"""
    # In production, this would use ML models
    text = (title + " " + description).lower()
    
    if any(word in text for word in ['payment', 'invoice', 'bill', 'money']):
        return 'Payment Issues'
    elif any(word in text for word in ['legal', 'court', 'lawsuit', 'attorney']):
        return 'Legal Matters'
    elif any(word in text for word in ['document', 'file', 'upload', 'download']):
        return 'Document Management'
    elif any(word in text for word in ['account', 'login', 'password', 'access']):
        return 'Account Issues'
    else:
        return 'General Inquiry'

@tickets_bp.route('/tickets', methods=['GET'])
def get_tickets():
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        if current_user.role == 'client':
            # Clients can only see their own tickets
            tickets = Ticket.query.filter_by(created_by_id=current_user.id).all()
        elif current_user.role in ['staff', 'legal', 'admin']:
            # Staff, legal, and admin can see all tickets
            tickets = Ticket.query.all()
        else:
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify([ticket.to_dict() for ticket in tickets]), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch tickets'}), 500

@tickets_bp.route('/tickets', methods=['POST'])
def create_ticket():
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['title', 'description']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create new ticket
        ticket = Ticket(
            title=data['title'],
            description=data['description'],
            priority=data.get('priority', 'Medium'),
            case_id=data.get('case_id'),  # Optional
            created_by_id=current_user.id
        )
        
        # AI-powered categorization
        ticket.category = categorize_ticket(ticket.title, ticket.description)
        
        # Auto-assign to staff
        assigned_staff = auto_assign_ticket(ticket)
        
        db.session.add(ticket)
        db.session.commit()
        
        return jsonify({
            'message': 'Ticket created successfully',
            'ticket': ticket.to_dict(),
            'assigned_staff': assigned_staff.to_dict_safe() if assigned_staff else None
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create ticket'}), 500

@tickets_bp.route('/tickets/<int:ticket_id>', methods=['GET'])
def get_ticket(ticket_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        ticket = Ticket.query.get_or_404(ticket_id)
        
        # Check permissions
        if current_user.role == 'client' and ticket.created_by_id != current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify(ticket.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': 'Ticket not found'}), 404

@tickets_bp.route('/tickets/<int:ticket_id>', methods=['PUT'])
def update_ticket(ticket_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        ticket = Ticket.query.get_or_404(ticket_id)
        data = request.json
        
        # Check permissions
        if current_user.role == 'client' and ticket.created_by_id != current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Update allowed fields based on role
        if current_user.role in ['staff', 'legal', 'admin']:
            # Staff can update status, priority, assignment
            if 'status' in data:
                ticket.status = data['status']
                if data['status'] == 'Resolved':
                    ticket.resolved_at = datetime.utcnow()
            if 'priority' in data:
                ticket.priority = data['priority']
            if 'assigned_to_id' in data:
                ticket.assigned_to_id = data['assigned_to_id']
            if 'category' in data:
                ticket.category = data['category']
        
        # Clients can only update title and description of their own tickets
        if current_user.role == 'client' and ticket.created_by_id == current_user.id:
            if 'title' in data:
                ticket.title = data['title']
            if 'description' in data:
                ticket.description = data['description']
        
        ticket.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Ticket updated successfully',
            'ticket': ticket.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update ticket'}), 500

@tickets_bp.route('/tickets/by-status/<status>', methods=['GET'])
def get_tickets_by_status(status):
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': 'Authentication required'}), 401
    
    if current_user.role not in ['staff', 'legal', 'admin']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        tickets = Ticket.query.filter_by(status=status).all()
        return jsonify([ticket.to_dict() for ticket in tickets]), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch tickets'}), 500

@tickets_bp.route('/my-tickets', methods=['GET'])
def get_my_tickets():
    """Get tickets assigned to current user (for staff)"""
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': 'Authentication required'}), 401
    
    if current_user.role not in ['staff', 'legal']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        tickets = Ticket.query.filter_by(assigned_to_id=current_user.id).all()
        return jsonify([ticket.to_dict() for ticket in tickets]), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch assigned tickets'}), 500

