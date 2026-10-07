# Deployment

The frontend is a static build on **GitHub Pages**. The Django API runs on **PythonAnywhere** (free tier). Every map service the API calls (OSRM, Photon, Nominatim) is on PythonAnywhere's free-tier allowlist.

## 1. Backend on PythonAnywhere

1. Create a free account at <https://www.pythonanywhere.com> and open a **Bash console**:

   ```bash
   git clone https://github.com/Abuubkar/roadlog.git
   cd roadlog/backend
   mkvirtualenv roadlog --python=python3.13
   pip install -r requirements.txt
   cp .env.example .env
   ```

2. Edit `backend/.env`:

   ```ini
   DJANGO_SECRET_KEY=<a long random string>
   DJANGO_DEBUG=false
   DJANGO_ALLOWED_HOSTS=<username>.pythonanywhere.com
   CORS_ALLOWED_ORIGINS=https://abuubkar.github.io
   GEO_USER_AGENT=RoadLog/1.0 (<your email>)
   ```

   Generate a key with `python -c "import secrets; print(secrets.token_urlsafe(50))"`.

3. In the **Web** tab, choose **Add a new web app → Manual configuration → Python 3.13**, then set:
   - **Source code:** `/home/<username>/roadlog/backend`
   - **Virtualenv:** `/home/<username>/.virtualenvs/roadlog`
   - **WSGI configuration file:** replace its contents with [`backend/deploy/pythonanywhere_wsgi.py`](../backend/deploy/pythonanywhere_wsgi.py), substituting `<username>`.

4. Click **Reload**, then check `https://<username>.pythonanywhere.com/api/health/`.

To update later, run `cd ~/roadlog && git pull`, then click **Reload**.

## 2. Frontend on GitHub Pages

1. **Settings → Pages → Source:** GitHub Actions.
2. **Settings → Secrets and variables → Actions → Variables:** add `VITE_API_URL` = `https://<username>.pythonanywhere.com`.
3. Push to `main`, or run **Deploy frontend to GitHub Pages** manually. The site is published at `https://abuubkar.github.io/roadlog/`.

The workflow builds with `BASE_PATH=/<repo>/`, so asset URLs resolve under the project subpath.
