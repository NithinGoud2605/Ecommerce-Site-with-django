web: npm install --legacy-peer-deps --prefix frontend && npm run build --prefix frontend && python backend/manage.py collectstatic --noinput && gunicorn backend.wsgi --log-file -
