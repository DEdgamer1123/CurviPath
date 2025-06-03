import os
from app import app

if __name__ == '__main__':
    # Get port from environment variable or use default 5000
    port = int(os.environ.get('PORT', 5000))
    # Run the application on 0.0.0.0 to make it externally accessible
    app.run(host='0.0.0.0', port=port, debug=True)
