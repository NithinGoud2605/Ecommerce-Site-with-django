web: npm install --prefix frontend --legacy-peer-deps && npm run build --prefix frontend && python backend/manage.py collectstatic --noinput && gunicorn backend.wsgi --log-file -
