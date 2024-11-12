web: npm install --prefix Frontend --legacy-peer-deps && npm run build --prefix Frontend && python backend/manage.py collectstatic --noinput && gunicorn backend.wsgi --log-file -
