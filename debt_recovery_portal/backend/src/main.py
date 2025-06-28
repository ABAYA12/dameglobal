import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.user import db
from src.models.case import Case
from src.models.document import Document
from src.models.ticket import Ticket
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.cases import cases_bp
from src.routes.tickets import tickets_bp
from src.routes.documents import documents_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Enable CORS for all routes
CORS(app, supports_credentials=True)

# Register blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(cases_bp, url_prefix='/api')
app.register_blueprint(tickets_bp, url_prefix='/api')
app.register_blueprint(documents_bp, url_prefix='/api')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Create tables and seed data
with app.app_context():
    db.create_all()
    
    # Create default admin user if it doesn't exist
    from src.models.user import User
    admin_user = User.query.filter_by(username='admin').first()
    if not admin_user:
        admin_user = User(
            username='admin',
            email='admin@demaeksglobal.com',
            first_name='System',
            last_name='Administrator',
            role='admin',
            company='Demaek\'s Global Limited'
        )
        admin_user.set_password('admin123')
        db.session.add(admin_user)
        
        # Create sample staff user
        staff_user = User(
            username='staff1',
            email='staff@demaeksglobal.com',
            first_name='John',
            last_name='Smith',
            role='staff',
            company='Demaek\'s Global Limited'
        )
        staff_user.set_password('staff123')
        db.session.add(staff_user)
        
        # Create sample legal user
        legal_user = User(
            username='legal1',
            email='legal@demaeksglobal.com',
            first_name='Sarah',
            last_name='Johnson',
            role='legal',
            company='Demaek\'s Global Limited'
        )
        legal_user.set_password('legal123')
        db.session.add(legal_user)
        
        db.session.commit()
        print("Default users created:")
        print("Admin: admin/admin123")
        print("Staff: staff1/staff123")
        print("Legal: legal1/legal123")

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return {'status': 'healthy', 'message': 'Debt Recovery Portal API is running'}, 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
