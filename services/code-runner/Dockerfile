FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /runner

COPY requirements.txt /runner/requirements.txt
RUN pip install --no-cache-dir -r /runner/requirements.txt

COPY app /runner/app

EXPOSE 8100

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8100"]
