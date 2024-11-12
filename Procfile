release: npm install --legacy-peer-deps && npm run build && python manage.py collectstatic -- --noinput

web: gunicorn backend.wsgi --log-file -
