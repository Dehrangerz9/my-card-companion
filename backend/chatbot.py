import json
import os
import random
import unicodedata

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB

MODEL_PATH = "saved_model.pkl"
TRAINING_DATA_PATH = "training_data.json"


def _normalize(text: str) -> str:
    """Lowercase, strip accents and extra whitespace."""
    text = text.lower().strip()
    text = unicodedata.normalize("NFD", text)
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    return text


def _mtime(path: str) -> float:
    try:
        return os.path.getmtime(path)
    except OSError:
        return 0.0


class CardVaultChatbot:
    def __init__(self, training_path: str = TRAINING_DATA_PATH, model_path: str = MODEL_PATH):
        self.training_path = training_path
        self.model_path = model_path

        self.vectorizer: TfidfVectorizer | None = None
        self.classifier: MultinomialNB | None = None
        self.tag_to_responses: dict[str, list[str]] = {}
        self.tag_to_action: dict[str, str | None] = {}
        self.tag_to_action_data: dict[str, dict] = {}

        self._load_or_train()

    # ------------------------------------------------------------------
    # Training / persistence
    # ------------------------------------------------------------------

    def _load_or_train(self) -> None:
        """Load saved model if it is newer than the training data; otherwise retrain."""
        if os.path.exists(self.model_path) and _mtime(self.model_path) >= _mtime(self.training_path):
            self._load_model()
        else:
            self._train()
            self._save_model()

    def _train(self) -> None:
        """Read training_data.json, build DataFrame, fit TF-IDF + Naive Bayes."""
        with open(self.training_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        rows: list[dict] = []
        for intent in data["intents"]:
            tag = intent["tag"]
            responses = intent.get("responses") or [intent.get("response", "")]
            self.tag_to_responses[tag] = responses
            self.tag_to_action[tag] = intent.get("action")
            self.tag_to_action_data[tag] = intent.get("action_data", {})
            for pattern in intent["patterns"]:
                rows.append({"text": _normalize(pattern), "tag": tag})

        df = pd.DataFrame(rows)

        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True)
        self.classifier = MultinomialNB(alpha=0.3)

        X = self.vectorizer.fit_transform(df["text"])
        self.classifier.fit(X, df["tag"])

        print(f"[Chatbot] Trained on {len(df)} patterns across {len(data['intents'])} intents.")

    def _save_model(self) -> None:
        payload = {
            "vectorizer": self.vectorizer,
            "classifier": self.classifier,
            "tag_to_responses": self.tag_to_responses,
            "tag_to_action": self.tag_to_action,
            "tag_to_action_data": self.tag_to_action_data,
        }
        joblib.dump(payload, self.model_path)
        print(f"[Chatbot] Model saved to {self.model_path}.")

    def _load_model(self) -> None:
        payload = joblib.load(self.model_path)
        self.vectorizer = payload["vectorizer"]
        self.classifier = payload["classifier"]
        self.tag_to_responses = payload["tag_to_responses"]
        self.tag_to_action = payload["tag_to_action"]
        self.tag_to_action_data = payload["tag_to_action_data"]
        print(f"[Chatbot] Model loaded from {self.model_path}.")

    def retrain(self) -> None:
        """Force a full retrain and overwrite the saved model."""
        if os.path.exists(self.model_path):
            os.remove(self.model_path)
        self._train()
        self._save_model()

    # ------------------------------------------------------------------
    # Inference
    # ------------------------------------------------------------------

    def predict(self, message: str) -> tuple[str, float]:
        """Return (tag, confidence) for the given message."""
        X = self.vectorizer.transform([_normalize(message)])
        tag = self.classifier.predict(X)[0]
        proba = float(self.classifier.predict_proba(X).max())
        return tag, proba

    def respond(self, message: str, confidence_threshold: float = 0.15) -> dict:
        """Return a full response dict with text, action and action_data."""
        tag, confidence = self.predict(message)

        if confidence < confidence_threshold:
            return {
                "response": (
                    "Não entendi muito bem. Pergunte **\"o que você faz\"** para ver "
                    "tudo que posso fazer por você."
                ),
                "tag": "unknown",
                "confidence": confidence,
                "action": None,
                "action_data": {},
            }

        responses = self.tag_to_responses.get(tag, ["Entendido."])
        return {
            "response": random.choice(responses),
            "tag": tag,
            "confidence": confidence,
            "action": self.tag_to_action.get(tag),
            "action_data": self.tag_to_action_data.get(tag, {}),
        }
