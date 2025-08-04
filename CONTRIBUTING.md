# Contributing to AI Fine-tuning & Workflow Platform

Thank you for your interest in contributing to our AI platform! We welcome contributions from the community and are excited to work with you.

## 🌟 Ways to Contribute

- **🐛 Bug Reports**: Help us identify and fix issues
- **✨ Feature Requests**: Suggest new features and improvements
- **📝 Documentation**: Improve our documentation and guides
- **💻 Code Contributions**: Submit bug fixes and new features
- **🧪 Testing**: Help test new features and report issues
- **🎨 UI/UX**: Improve the user interface and experience

## 🚀 Getting Started

### Prerequisites

- **Hardware**: Apple Silicon Mac (M1/M2/M3) recommended
- **Software**: Docker, Python 3.11+, Node.js 18+
- **Tools**: Git, VS Code (recommended)

### Development Setup

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/product-platform_0.0.1.git
   cd product-platform_0.0.1
   ```

2. **Set Up Development Environment**
   ```bash
   # Create development environment
   python -m venv dev-env
   source dev-env/bin/activate
   
   # Install development dependencies
   pip install -r requirements-dev.txt
   
   # Install pre-commit hooks
   pre-commit install
   ```

3. **Configure Environment**
   ```bash
   # Copy environment template
   cp .env.example .env.dev
   
   # Edit with your development settings
   # Set ENVIRONMENT=development
   ```

4. **Start Development Services**
   ```bash
   # Start databases only
   docker compose -f docker-compose.dev.yml up -d postgres redis
   
   # Start services in development mode
   ./scripts/dev-start.sh
   ```

## 📋 Development Workflow

### Branch Strategy

- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/**: New features (`feature/add-model-validation`)
- **bugfix/**: Bug fixes (`bugfix/fix-memory-leak`)
- **hotfix/**: Critical production fixes

### Making Changes

1. **Create a Feature Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow our coding standards (see below)
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   # Run all tests
   pytest
   
   # Run specific test suite
   pytest tests/unit/
   pytest tests/integration/
   
   # Run with coverage
   pytest --cov=app tests/
   
   # Run linting
   flake8 .
   black --check .
   ```

4. **Commit Your Changes**
   ```bash
   # Use conventional commit format
   git add .
   git commit -m "feat: add model validation endpoint"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create Pull Request on GitHub
   ```

## 📝 Coding Standards

### Python Code Style

- **Formatter**: Black with line length 88
- **Linter**: Flake8 with custom configuration
- **Type Hints**: Required for all public functions
- **Docstrings**: Google style docstrings

```python
def fine_tune_model(
    model_name: str,
    dataset_path: str,
    config: Dict[str, Any]
) -> FineTuneResult:
    """Fine-tune a model with the given dataset.
    
    Args:
        model_name: Name of the base model to fine-tune
        dataset_path: Path to the training dataset
        config: Training configuration parameters
        
    Returns:
        FineTuneResult containing training metrics and model path
        
    Raises:
        ModelNotFoundError: If the base model doesn't exist
        DatasetError: If the dataset is invalid
    """
    pass
```

### JavaScript/TypeScript Style

- **Formatter**: Prettier
- **Linter**: ESLint with TypeScript support
- **Style**: Functional components with hooks
- **Testing**: Jest and React Testing Library

```typescript
interface ModelConfig {
  modelType: string;
  batchSize: number;
  learningRate: number;
}

const FineTuneForm: React.FC<Props> = ({ onSubmit }) => {
  const [config, setConfig] = useState<ModelConfig>({
    modelType: 'llama3.2',
    batchSize: 1,
    learningRate: 1e-5,
  });

  return (
    <form onSubmit={handleSubmit}>
      {/* Form content */}
    </form>
  );
};
```

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(finetune): add model validation before training
fix(api): handle timeout errors in model download
docs(readme): update installation instructions
test(workflow): add integration tests for YAML parser
```

## 🧪 Testing Guidelines

### Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── test_finetune.py
│   ├── test_workflow.py
│   └── test_models.py
├── integration/             # Integration tests
│   ├── test_api_endpoints.py
│   ├── test_database.py
│   └── test_mlx_integration.py
├── e2e/                     # End-to-end tests
│   ├── test_complete_workflow.py
│   └── test_user_journey.py
└── fixtures/                # Test data and fixtures
    ├── datasets/
    └── models/
```

### Writing Tests

```python
import pytest
from unittest.mock import Mock, patch
from app.services.finetune import FineTuneService

class TestFineTuneService:
    @pytest.fixture
    def service(self):
        return FineTuneService(base_path="/tmp/test")
    
    @pytest.fixture
    def mock_config(self):
        return {
            "model_type": "llama3.2",
            "batch_size": 1,
            "learning_rate": 1e-5
        }
    
    def test_validate_config_success(self, service, mock_config):
        """Test successful configuration validation."""
        result = service.validate_config(mock_config)
        assert result.is_valid
        assert result.errors == []
    
    def test_validate_config_invalid_batch_size(self, service):
        """Test configuration validation with invalid batch size."""
        config = {"batch_size": 0}
        result = service.validate_config(config)
        assert not result.is_valid
        assert "batch_size must be positive" in result.errors
    
    @patch('app.services.finetune.mlx_lm.load')
    def test_model_loading(self, mock_load, service):
        """Test model loading with mocked MLX."""
        mock_load.return_value = (Mock(), Mock())
        model, tokenizer = service.load_model("test-model")
        assert model is not None
        assert tokenizer is not None
        mock_load.assert_called_once_with("test-model")
```

### Test Coverage

- **Minimum Coverage**: 80% overall
- **Critical Paths**: 95% coverage required
- **New Features**: Must include comprehensive tests
- **Bug Fixes**: Must include regression tests

## 📚 Documentation Guidelines

### Code Documentation

- **Docstrings**: Required for all public functions and classes
- **Type Hints**: Required for function parameters and returns
- **Comments**: Explain complex logic and business rules
- **README**: Update for new features and changes

### API Documentation

- **OpenAPI/Swagger**: Auto-generated from FastAPI
- **Examples**: Include request/response examples
- **Error Codes**: Document all possible error responses
- **Rate Limits**: Document any rate limiting

### User Documentation

- **Tutorials**: Step-by-step guides for common tasks
- **How-to Guides**: Problem-solving oriented documentation
- **Reference**: Complete API and configuration reference
- **Explanations**: Conceptual documentation

## 🐛 Bug Reports

### Before Submitting

1. **Search existing issues** to avoid duplicates
2. **Check the troubleshooting guide** in README.md
3. **Test with the latest version** if possible
4. **Gather system information** (OS, hardware, versions)

### Bug Report Template

```markdown
**Bug Description**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. macOS 13.0]
- Hardware: [e.g. Apple M2]
- Python Version: [e.g. 3.11.5]
- Platform Version: [e.g. 1.0.0]

**Additional Context**
Any other context about the problem.

**Logs**
```
Paste relevant log output here
```
```

## ✨ Feature Requests

### Feature Request Template

```markdown
**Feature Description**
A clear description of what you want to happen.

**Problem Statement**
What problem does this feature solve?

**Proposed Solution**
Describe your proposed solution.

**Alternatives Considered**
Other solutions you've considered.

**Additional Context**
Any other context, mockups, or examples.

**Implementation Notes**
Technical considerations or suggestions.
```

## 🔍 Code Review Process

### Review Criteria

- **Functionality**: Does the code work as intended?
- **Tests**: Are there adequate tests with good coverage?
- **Documentation**: Is the code well-documented?
- **Performance**: Are there any performance concerns?
- **Security**: Are there any security implications?
- **Style**: Does the code follow our style guidelines?

### Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are included and pass
- [ ] Documentation is updated
- [ ] No breaking changes (or properly documented)
- [ ] Performance impact considered
- [ ] Security implications reviewed
- [ ] Backward compatibility maintained

## 🏆 Recognition

We appreciate all contributions! Contributors will be:

- **Listed in CONTRIBUTORS.md**
- **Mentioned in release notes** for significant contributions
- **Invited to join** our contributor Discord channel
- **Eligible for swag** (stickers, t-shirts) for major contributions

## 📞 Getting Help

- **GitHub Discussions**: Ask questions and get help
- **Discord**: Real-time chat with maintainers and community
- **Email**: maintainers@platform.ai for private questions

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to our AI platform! 🚀
