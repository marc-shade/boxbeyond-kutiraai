import os
import sys
import subprocess
import signal

# Get the directory containing the script
script_dir = os.path.dirname(os.path.abspath(__file__))

# Add the script directory to sys.path
sys.path.insert(0, script_dir)

def signal_handler(sig, frame):
    print('Shutting down...')
    flask_process.terminate()
    sys.exit(0)
    
if __name__ == '__main__':
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Start Flask app in a separate process
    flask_process = subprocess.Popen([sys.executable, os.path.join(script_dir, 'app.py')])
    
    # Wait for the Flask process to finish
    flask_process.wait()