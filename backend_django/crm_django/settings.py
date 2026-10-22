import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = 'django-dev-secret-change-in-production'
DEBUG = True
ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv(
        'DJANGO_ALLOWED_HOSTS',
        'localhost,127.0.0.1,crm-system-1pxk.onrender.com',
    ).split(',')
    if host.strip()
]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'crm_api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]

ROOT_URLCONF = 'crm_django.urls'
TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [],
    'APP_DIRS': True,
    'OPTIONS': {'context_processors': [
        'django.template.context_processors.request',
        'django.contrib.auth.context_processors.auth',
        'django.contrib.messages.context_processors.messages',
    ]},
}]
WSGI_APPLICATION = 'crm_django.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'crm_django.sqlite3',
    }
}

AUTH_USER_MODEL = 'crm_api.User'
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ('rest_framework_simplejwt.authentication.JWTAuthentication',),
    'DEFAULT_PERMISSION_CLASSES': ('rest_framework.permissions.IsAuthenticated',),
}
SIMPLE_JWT = {'AUTH_HEADER_TYPES': ('Bearer',)}
CORS_ALLOWED_ORIGINS = [
    origin.strip().rstrip('/')
    for origin in os.getenv(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:5173,http://127.0.0.1:5173',
    ).split(',')
    if origin.strip()
]
CORS_ALLOWED_ORIGIN_REGEXES = [
    regex.strip()
    for regex in os.getenv(
        'CORS_ALLOWED_ORIGIN_REGEXES',
        r'^https://crmsystem-[a-z0-9-]+-av748346-5887s-projects\.vercel\.app$',
    ).split(',')
    if regex.strip()
]
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
