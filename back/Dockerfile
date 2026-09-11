FROM python:3.12-slim
WORKDIR /code
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN pip install --no-cache-dir poetry
COPY pyproject.toml poetry.lock* ./
RUN poetry install --only main --no-root || pip install --no-cache-dir fastapi[standard] psycopg[binary] pydantic-settings pyjwt "pwdlib[argon2]" python-dotenv email-validator httpx python-multipart
COPY . .
EXPOSE 8000
CMD ["sh", "-c", "python migrate.py && uvicorn api.app:app --host 0.0.0.0 --port 8000"]
