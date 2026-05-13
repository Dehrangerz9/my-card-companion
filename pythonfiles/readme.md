Method	Route	Action
POST	/users/<id>/cards	Create a card for a user (card_number, optional credit_limit, invoice_amount)
GET	/users/<id>/cards	List all cards for a user
GET	/cards/<id>	Get a single card
PUT	/cards/<id>	Update a card
DELETE	/cards/<id>	Delete a card

Method	Route	Action
POST	users	Register a user (name, email, optional age)
GET	users	List all users
GET	/users/<id>	Get a single user
PUT	/users/<id>	Update a user
DELETE	/users/<id>	Delete a user

pip install flask
python pythonfiles/app.py