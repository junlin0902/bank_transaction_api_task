from flask import Flask, jsonify, request
import mysql.connector
from mysql.connector import Error
from flask_cors import CORS
import logging
import datetime
from decimal import Decimal

app = Flask(__name__)
CORS(app)

logging.basicConfig(filename='record.log', level=logging.DEBUG)

def convertTime(s):
    return datetime.datetime.strptime(s, "%a, %d %b %Y %H:%M:%S %Z").strftime('%Y-%m-%d %H:%M:%S')

def create_connection():
    connection = None
    try:
        connection = mysql.connector.connect(
            host="localhost",
            user="jy",
            password="junlin902",
            database="bank_transactions"
        )
        print("Connection to MySQL DB successful")
    except Error as e:
        print(f"The error '{e}' occurred")
    return connection

@app.route('/account', methods=['GET'])
def get_accounts():
    connection = create_connection()
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Account")
    rows = cursor.fetchall()
    return jsonify(rows)

@app.route('/account/<id>', methods=['GET', 'POST', 'DELETE'])
def accountId(id):
    connection = create_connection()
    cursor = connection.cursor(dictionary=True)
    if request.method == 'GET':
        query = "SELECT * FROM Transaction WHERE PayerID = %s OR PayeeID = %s"
        cursor.execute(query, (id, id))
        rows = cursor.fetchall()
        return jsonify(rows)
    elif request.method == 'POST':
        data = request.form
        accountID = data["AccountID"]
        balance = data["Balance"]
        query = "SELECT * FROM Account WHERE AccountID = %s"
        cursor.execute(query, (accountID,))
        res = cursor.fetchone()
        if Decimal(balance )< 0:
            return jsonify({"message": "Invalid balance"}), 400
        if res is None:
            query = "INSERT INTO Account (AccountID, Balance) VALUES (%s, %s)"
            cursor.execute(query, (accountID, balance))
            connection.commit()
            return jsonify({"message": "Account created"})
        else:
            query = "UPDATE Account SET Balance = %s WHERE AccountID = %s"
            cursor.execute(query, (balance, accountID))
            connection.commit()
            return jsonify({"message": "Account updated"})
    elif request.method == 'DELETE':
        query = "DELETE FROM Account WHERE AccountID = %s"
        cursor.execute(query, (id,))
        connection.commit()
        return jsonify({"message": "Account deleted"})

@app.route('/transaction', methods=['GET'])
def get_transactions():
    connection = create_connection()
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Transaction")
    rows = cursor.fetchall()
    return jsonify(rows)


@app.route('/transaction/<id>', methods=['POST'])
def transactionId(id):
    connection = create_connection()
    cursor = connection.cursor(dictionary=True)
    data = request.form
    payerID = data["PayerID"]
    payeeID = data["PayeeID"]
    amount = data["Amount"]

    if payerID == payeeID:
        return jsonify({"message": "Invalid PayeeID"}), 400
    elif Decimal(amount) <= 0:
        return jsonify({"message": "Invalid amount"}), 400
    
    query = "SELECT * FROM Account WHERE AccountID = %s"
    cursor.execute(query, (payerID,))
    payer_balance = cursor.fetchone()['Balance']
    print(payer_balance)

    if Decimal(payer_balance) < Decimal(amount):
        return jsonify({"message": "Insufficient balance"}), 400
    
    cursor.execute(query, (payeeID,))
    payee_balance = cursor.fetchone()['Balance']
    print(payee_balance)
    
    new_payer_balance = Decimal(payer_balance) - Decimal(amount)
    new_payee_balance = Decimal(payee_balance) + Decimal(amount)
    print(new_payer_balance)
    print(new_payee_balance)
    cursor.execute("UPDATE Account SET Balance = %s WHERE AccountID = %s", (new_payer_balance, payerID))
    cursor.execute("UPDATE Account SET Balance = %s WHERE AccountID = %s", (new_payee_balance, payeeID))

    query = "INSERT INTO Transaction (PayerID, PayeeID, Amount) VALUES (%s, %s, %s)"
    cursor.execute(query, (payerID, payeeID, amount))
    connection.commit()
    return jsonify({"message": "Transaction created"})


if __name__ == "__main__":
    app.run(debug=True)