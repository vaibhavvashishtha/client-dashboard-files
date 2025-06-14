FROM python:3.11

WORKDIR /code

COPY requirements.txt .
RUN pip install --default-timeout=100 --no-cache-dir -i https://pypi.org/simple -r requirements.txt

COPY app ./app
RUN mkdir -p /code/storage

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
