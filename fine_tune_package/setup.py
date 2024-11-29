from setuptools import setup, find_packages
import os
import platform

# Determine if we're on Apple Silicon
is_apple_silicon = platform.machine() == 'arm64' and platform.system() == 'Darwin'

if is_apple_silicon:
    libffi_path = '/opt/homebrew/opt/libffi/lib/libffi.dylib'
else:
    libffi_path = '/usr/local/opt/libffi/lib/libffi.dylib'

# Function to get all files in a directory
def get_files_in_directory(directory):
    file_list = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            file_list.append(os.path.join(root, file))
    return file_list

# Get all files from mlx_lm_files
mlx_lm_files = get_files_in_directory('mlx_lm_files')

APP = ['run.py']
DATA_FILES = ['app.py', 'fine_tune.py', ('mlx_lm_files', mlx_lm_files)]
OPTIONS = {
    'argv_emulation': True,
    'packages': ['flask', 'mlx', 'mlx_lm', 'transformers','numpy'],
    'includes': ['werkzeug', 'jinja2', 'libs/mlx'],
    'excludes': ['setuptools'],
    'frameworks': [libffi_path],
    'iconfile': 'rooot_logo.png',
    'plist': {
        'CFBundleName': 'FlaskMacApp',
        'CFBundleDisplayName': 'Flask Mac App',
        'CFBundleGetInfoString': "Flask application packaged as Mac app",
        'CFBundleIdentifier': "com.example.FlaskMacApp",
        'CFBundleVersion': "0.1.0",
        'CFBundleShortVersionString': "0.1.0",
    }
}

setup(
    app=APP,
    data_files=DATA_FILES,
    options={'py2app': OPTIONS},
    setup_requires=['py2app'],
    packages=find_packages(),
    include_package_data=True,
    install_requires=['flask', 'mlx_lm', 'transformers','numpy']
)