from flask import Flask, request, jsonify
import sqlite3

app = Flask(__name__)
DATABASE = "credit_card.db"


def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            cpf TEXT UNIQUE,
            age INTEGER
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS credit_cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            card_number TEXT NOT NULL UNIQUE,
            credit_limit REAL NOT NULL DEFAULT 0,
            available_limit REAL NOT NULL DEFAULT 0,
            invoice_amount REAL NOT NULL DEFAULT 0,
            card_expiration TEXT,
            invoice_due_date TEXT,
            card_status TEXT NOT NULL DEFAULT 'active',
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    conn.commit()
    conn.close()

@app.route("/users", methods=["POST"])
def create_user():
    data = request.get_json()
    if not data or not data.get("name") or not data.get("email"):
        return jsonify({"error": "name and email are required"}), 400

    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO users (name, email, cpf, age) VALUES (?, ?, ?, ?)",
            (data["name"], data["email"], data.get("cpf"), data.get("age")),
        )
        conn.commit()
        user_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "email or cpf already exists"}), 409
    conn.close()
    return jsonify({"id": user_id, "name": data["name"], "email": data["email"], "cpf": data.get("cpf"), "age": data.get("age")}), 201

@app.route("/users", methods=["GET"])
def list_users():
    conn = get_db()
    users = conn.execute("SELECT * FROM users").fetchall()
    conn.close()
    return jsonify([dict(u) for u in users])

@app.route("/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if not user:
        return jsonify({"error": "user not found"}), 404
    return jsonify(dict(user))

@app.route("/users/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "request body required"}), 400

    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        conn.close()
        return jsonify({"error": "user not found"}), 404

    name = data.get("name", user["name"])
    email = data.get("email", user["email"])
    cpf = data.get("cpf", user["cpf"])
    age = data.get("age", user["age"])

    try:
        conn.execute(
            "UPDATE users SET name = ?, email = ?, cpf = ?, age = ? WHERE id = ?",
            (name, email, cpf, age, user_id),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "email or cpf already exists"}), 409
    conn.close()
    return jsonify({"id": user_id, "name": name, "email": email, "cpf": cpf, "age": age})

@app.route("/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        conn.close()
        return jsonify({"error": "user not found"}), 404
    conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "user deleted"})


# --- Credit Card endpoints ---

@app.route("/users/<int:user_id>/cards", methods=["POST"])
def create_card(user_id):
    data = request.get_json()
    if not data or not data.get("card_number"):
        return jsonify({"error": "card_number is required"}), 400

    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        conn.close()
        return jsonify({"error": "user not found"}), 404

    credit_limit = data.get("credit_limit", 0)
    available_limit = data.get("available_limit", credit_limit)
    invoice_amount = data.get("invoice_amount", 0)
    card_expiration = data.get("card_expiration")
    invoice_due_date = data.get("invoice_due_date")
    card_status = data.get("card_status", "active")

    try:
        conn.execute(
            "INSERT INTO credit_cards (user_id, card_number, credit_limit, available_limit, invoice_amount, card_expiration, invoice_due_date, card_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (user_id, data["card_number"], credit_limit, available_limit, invoice_amount, card_expiration, invoice_due_date, card_status),
        )
        conn.commit()
        card_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "card_number already exists"}), 409
    conn.close()
    return jsonify({
        "id": card_id,
        "user_id": user_id,
        "card_number": data["card_number"],
        "credit_limit": credit_limit,
        "available_limit": available_limit,
        "invoice_amount": invoice_amount,
        "card_expiration": card_expiration,
        "invoice_due_date": invoice_due_date,
        "card_status": card_status,
    }), 201

@app.route("/users/<int:user_id>/cards", methods=["GET"])
def list_cards(user_id):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        conn.close()
        return jsonify({"error": "user not found"}), 404
    cards = conn.execute("SELECT * FROM credit_cards WHERE user_id = ?", (user_id,)).fetchall()
    conn.close()
    return jsonify([dict(c) for c in cards])

@app.route("/cards/<int:card_id>", methods=["GET"])
def get_card(card_id):
    conn = get_db()
    card = conn.execute("SELECT * FROM credit_cards WHERE id = ?", (card_id,)).fetchone()
    conn.close()
    if not card:
        return jsonify({"error": "card not found"}), 404
    return jsonify(dict(card))

@app.route("/cards/<int:card_id>", methods=["PUT"])
def update_card(card_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "request body required"}), 400

    conn = get_db()
    card = conn.execute("SELECT * FROM credit_cards WHERE id = ?", (card_id,)).fetchone()
    if not card:
        conn.close()
        return jsonify({"error": "card not found"}), 404

    card_number = data.get("card_number", card["card_number"])
    credit_limit = data.get("credit_limit", card["credit_limit"])
    available_limit = data.get("available_limit", card["available_limit"])
    invoice_amount = data.get("invoice_amount", card["invoice_amount"])
    card_expiration = data.get("card_expiration", card["card_expiration"])
    invoice_due_date = data.get("invoice_due_date", card["invoice_due_date"])
    card_status = data.get("card_status", card["card_status"])

    try:
        conn.execute(
            "UPDATE credit_cards SET card_number = ?, credit_limit = ?, available_limit = ?, invoice_amount = ?, card_expiration = ?, invoice_due_date = ?, card_status = ? WHERE id = ?",
            (card_number, credit_limit, available_limit, invoice_amount, card_expiration, invoice_due_date, card_status, card_id),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "card_number already exists"}), 409
    conn.close()
    return jsonify({"id": card_id, "user_id": card["user_id"], "card_number": card_number, "credit_limit": credit_limit, "available_limit": available_limit, "invoice_amount": invoice_amount, "card_expiration": card_expiration, "invoice_due_date": invoice_due_date, "card_status": card_status})


 @app.route("/cards/<int:card_id>", methods=["DELETE"])
def delete_card(card_id):
    conn = get_db()
    card = conn.execute("SELECT * FROM credit_cards WHERE id = ?", (card_id,)).fetchone()
    if not card:
        conn.close()
        return jsonify({"error": "card not found"}), 404
    conn.execute("DELETE FROM credit_cards WHERE id = ?", (card_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "card deleted"})


if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)
