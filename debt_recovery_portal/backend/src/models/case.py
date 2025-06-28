from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from src.models.user import db

class Case(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    amount_owed = db.Column(db.Float, nullable=False)
    debtor_company = db.Column(db.String(200), nullable=False)
    debtor_contact = db.Column(db.String(200), nullable=True)
    status = db.Column(db.String(50), default='Open', nullable=False)  # Open, In Progress, Resolved, Closed
    priority = db.Column(db.String(20), default='Medium', nullable=False)  # Low, Medium, High, Critical
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Foreign keys
    client_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    assigned_staff_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    # Relationships
    client = db.relationship('User', foreign_keys=[client_id], backref='client_cases')
    assigned_staff = db.relationship('User', foreign_keys=[assigned_staff_id], backref='assigned_cases')
    documents = db.relationship('Document', backref='case', lazy=True, cascade='all, delete-orphan')
    tickets = db.relationship('Ticket', backref='case', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Case {self.title}>'

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'amount_owed': self.amount_owed,
            'debtor_company': self.debtor_company,
            'debtor_contact': self.debtor_contact,
            'status': self.status,
            'priority': self.priority,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'client_id': self.client_id,
            'assigned_staff_id': self.assigned_staff_id,
            'client': self.client.to_dict() if self.client else None,
            'assigned_staff': self.assigned_staff.to_dict() if self.assigned_staff else None,
            'document_count': len(self.documents) if self.documents else 0,
            'ticket_count': len(self.tickets) if self.tickets else 0
        }

    def to_dict_client_view(self):
        """Limited view for clients - they can't see documents"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'amount_owed': self.amount_owed,
            'debtor_company': self.debtor_company,
            'status': self.status,
            'priority': self.priority,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'assigned_staff': self.assigned_staff.to_dict() if self.assigned_staff else None
        }

