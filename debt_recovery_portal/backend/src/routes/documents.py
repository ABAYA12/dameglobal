from flask import Blueprint, jsonify, request, session, send_file
from werkzeug.utils import secure_filename
from src.models.user import User, db
from src.models.case import Case
from src.models.document import Document
import os
import uuid
from datetime import datetime

documents_bp = Blueprint('documents', __name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'xls', 'xlsx'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

def get_current_user():
    """Helper function to get current user from session"""
    user_id = session.get('user_id')
    if not user_id:
        return None
    return User.query.get(user_id)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_upload_folder():
    """Create upload folder if it doesn't exist"""
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)

@documents_bp.route('/cases/<int:case_id>/documents', methods=['POST'])
def upload_document(case_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': 'Authentication required'}), 401
    
    # Only staff, legal, and admin can upload documents
    if current_user.role not in ['staff', 'legal', 'admin']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        case = Case.query.get_or_404(case_id)
        
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Create upload folder
        create_upload_folder()
        
        # Generate unique filename
        original_filename = secure_filename(file.filename)
        file_extension = original_filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        
        # Create case-specific folder
        case_folder = os.path.join(UPLOAD_FOLDER, f"case_{case_id}")
        if not os.path.exists(case_folder):
            os.makedirs(case_folder)
        
        file_path = os.path.join(case_folder, unique_filename)
        
        # Save file
        file.save(file_path)
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Create document record
        document = Document(
            filename=unique_filename,
            original_filename=original_filename,
            file_path=file_path,
            file_size=file_size,
            mime_type=file.content_type or 'application/octet-stream',
            description=request.form.get('description', ''),
            case_id=case_id,
            uploaded_by_id=current_user.id
        )
        
        db.session.add(document)
        db.session.commit()
        
        return jsonify({
            'message': 'Document uploaded successfully',
            'document': document.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to upload document'}), 500

@documents_bp.route('/documents/<int:document_id>', methods=['GET'])
def get_document(document_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        document = Document.query.get_or_404(document_id)
        case = Case.query.get(document.case_id)
        
        # Check permissions
        if current_user.role == 'client':
            if case.client_id != current_user.id:
                return jsonify({'error': 'Unauthorized'}), 403
            # Clients can't view documents, only know they exist
            return jsonify({'error': 'Document access restricted'}), 403
        
        # Staff, legal, and admin can view documents
        if current_user.role in ['staff', 'legal', 'admin']:
            return jsonify(document.to_dict()), 200
        
        return jsonify({'error': 'Unauthorized'}), 403
        
    except Exception as e:
        return jsonify({'error': 'Document not found'}), 404

@documents_bp.route('/documents/<int:document_id>/download', methods=['GET'])
def download_document(document_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': 'Authentication required'}), 401
    
    # Only staff, legal, and admin can download documents
    if current_user.role not in ['staff', 'legal', 'admin']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        document = Document.query.get_or_404(document_id)
        
        if not os.path.exists(document.file_path):
            return jsonify({'error': 'File not found on disk'}), 404
        
        return send_file(
            document.file_path,
            as_attachment=True,
            download_name=document.original_filename
        )
        
    except Exception as e:
        return jsonify({'error': 'Failed to download document'}), 500

@documents_bp.route('/documents/<int:document_id>', methods=['DELETE'])
def delete_document(document_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': 'Authentication required'}), 401
    
    # Only admin can delete documents
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        document = Document.query.get_or_404(document_id)
        
        # Delete file from disk
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
        
        # Delete database record
        db.session.delete(document)
        db.session.commit()
        
        return jsonify({'message': 'Document deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete document'}), 500

