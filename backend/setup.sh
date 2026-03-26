cd zeroto
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then fill in your API key
uvicorn main:app --reload --port 8000