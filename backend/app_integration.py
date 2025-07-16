# Integration file to add the enhanced admin routes to your existing Flask app
# Add this to your main app.py file

from admin_enhancements import admin_bp

# Register the blueprint in your main Flask app
# Add this line after creating your Flask app instance:
# app.register_blueprint(admin_bp)

# Example integration:
"""
from flask import Flask
from admin_enhancements import admin_bp

app = Flask(__name__)
# ... your existing configuration ...

# Register the enhanced admin blueprint
app.register_blueprint(admin_bp)

# ... rest of your existing routes ...
"""