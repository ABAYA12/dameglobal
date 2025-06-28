from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from src.models.user import db

class Document(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)  # in bytes
    mime_type = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Foreign keys
    case_id = db.Column(db.Integer, db.ForeignKey('case.id'), nullable=False)
    uploaded_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Relationships
    uploaded_by = db.relationship('User', backref='uploaded_documents')

    def __repr__(self):
        return f'<Document {self.original_filename}>'

    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'original_filename': self.original_filename,
            'file_path': self.file_path,
            'file_size': self.file_size,
            'mime_type': self.mime_type,
            'description': self.description,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
            'case_id': self.case_id,
            'uploaded_by_id': self.uploaded_by_id,
            'uploaded_by': self.uploaded_by.to_dict() if self.uploaded_by else None
        }

