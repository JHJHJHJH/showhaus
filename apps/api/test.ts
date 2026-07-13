import { plainToClass } from "class-transformer";
import { TransactionEntity } from "./src/transaction/transaction.entity";
import { UraPrivateResiEntity } from "./src/ura-private-resi/ura-private-resi.entity";
const obj = {
    "street": "ZEHNDER ROAD",
    "x": "22734.9253",
    "project": "LANDED HOUSING DEVELOPMENT",
    "y": "29502.42071",
    "transaction": [
        {
            "area": "524.3",
            "floorRange": "-",
            "noOfUnits": "1",
            "contractDate": "0220",
            "typeOfSale": "3",
            "price": "5500000",
            "propertyType": "Semi-detached",
            "district": "05",
            "typeOfArea": "Land",
            "tenure": "Freehold"
        },
        {
            "area": "308",
            "floorRange": "-",
            "noOfUnits": "1",
            "contractDate": "0918",
            "typeOfSale": "3",
            "price": "5000000",
            "propertyType": "Semi-detached",
            "district": "05",
            "typeOfArea": "Land",
            "tenure": "Freehold"
        },
        {
            "area": "314",
            "floorRange": "-",
            "noOfUnits": "1",
            "contractDate": "0618",
            "typeOfSale": "3",
            "price": "4750000",
            "propertyType": "Semi-detached",
            "district": "05",
            "typeOfArea": "Land",
            "tenure": "Freehold"
        },
        {
            "area": "308",
            "floorRange": "-",
            "noOfUnits": "1",
            "contractDate": "0921",
            "typeOfSale": "3",
            "price": "5200000",
            "propertyType": "Semi-detached",
            "district": "05",
            "typeOfArea": "Land",
            "tenure": "Freehold"
        }
    ],
    "marketSegment": "RCR"
}

const tx = {
    "area": "524.3",
    "floorRange": "-",
    "noOfUnits": "1",
    "contractDate": "0220",
    "typeOfSale": "3",
    "price": "5500000",
    "propertyType": "Semi-detached",
    "district": "05",
    "typeOfArea": "Land",
    "tenure": "Freehold"
}

const transactions = [
    {
        "area": "524.3",
        "floorRange": "-",
        "noOfUnits": "1",
        "contractDate": "0220",
        "typeOfSale": "3",
        "price": "5500000",
        "propertyType": "Semi-detached",
        "district": "05",
        "typeOfArea": "Land",
        "tenure": "Freehold"
    },
    {
        "area": "308",
        "floorRange": "-",
        "noOfUnits": "1",
        "contractDate": "0918",
        "typeOfSale": "3",
        "price": "5000000",
        "propertyType": "Semi-detached",
        "district": "05",
        "typeOfArea": "Land",
        "tenure": "Freehold"
    },
    {
        "area": "314",
        "floorRange": "-",
        "noOfUnits": "1",
        "contractDate": "0618",
        "typeOfSale": "3",
        "price": "4750000",
        "propertyType": "Semi-detached",
        "district": "05",
        "typeOfArea": "Land",
        "tenure": "Freehold"
    },
    {
        "area": "308",
        "floorRange": "-",
        "noOfUnits": "1",
        "contractDate": "0921",
        "typeOfSale": "3",
        "price": "5200000",
        "propertyType": "Semi-detached",
        "district": "05",
        "typeOfArea": "Land",
        "tenure": "Freehold"
    }
]
// const realTransaction = plainToClass( TransactionEntity, transactions);

// console.log( realTransaction );

const loc = plainToClass( UraPrivateResiEntity, obj);
console.log(loc);