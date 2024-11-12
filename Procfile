release: npm install --prefix frontend && npm run build --prefix frontend && python manage.py collectstatic --noinput
web: gunicorn backend.wsgi --log-file -
