const { response, request } = require('express')
const express = require('express')
const { v4: uuidv4 } = require('uuid')

const app = express()


app.use(express.json())

const customers = []

//middleware
function verifyIfExistsAccountCpf(req, res, next) {
    const {cpf} = req.headers
    const customer = customers.find((customer) => customer.cpf === cpf)

    if (!customer) {
        res.status(400).json({error: "Customer not found"})
    }

    request.customer = customer

    return next()
}

function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === 'credit') {
            return acc + operation.amount
        } else {
            return acc - operation.amount
        }
    }, 0)
    return balance
}

app.post("/account", (req, res) => {
    const {cpf, name } = req.body
    const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf)

    if (customerAlreadyExists == true) {
        return res.status(400).json({error: "Customer already exists"})
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    })

    return res.status(201).json('foi')
})

app.get("/statement/",verifyIfExistsAccountCpf, (req,res) => {
    const {customer} = request
    
    return res.json(customer.statement)
})

app.post("/deposit",verifyIfExistsAccountCpf , (req, res) => {
    const {description, amount} = req.body
    const {customer} = request
    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }
    
    customer.statement.push(statementOperation)

    return res.status(201).json("dale")
})

app.post("/withdraw",verifyIfExistsAccountCpf, (req, res) => {
    const {customer} = request
    const balance = getBalance(customer.statement)
    const {amount} = req.body
    

    if (balance < amount) {
        return res.status(400).json({error: "insuficient funds"})
    } 

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit",
    }

    customer.statement.push(statementOperation)

    return res.status(201).send()
})

app.get("/statement/date",verifyIfExistsAccountCpf, (req,res) => {
    const {customer} = request
    const {date} = req.query

    const dateFormat = new Date(date + " 00:00")

    const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString())
    
    return res.json(statement)
})

app.put("/account", verifyIfExistsAccountCpf, (req, res) => {
    const {name} = req.body
    const {customer} = request

    customer.name = name

    return res.status(201).send()
})

app.get("/account",verifyIfExistsAccountCpf, (req, res) => {
    const {customer} = request
    
    return res.json(customer)
})

app.delete("/account", verifyIfExistsAccountCpf, (req, res) => {
    const {customer} = request

    //splice
    customers.splice(customer, 1)

    return res.status(200).json(customers)
})

app.get("/balance", verifyIfExistsAccountCpf, (req, res) => {
    const {customer} = request

    const balance = getBalance(customer.statement)

    return res.json(balance)
})

app.listen(3333)