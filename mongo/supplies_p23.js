/* global use, db */
// MongoDB Playground
// To disable this template go to Settings | MongoDB | Use Default Template For Playground.
// Make sure you are connected to enable completions and to be able to run a playground.
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.
// The result of the last command run in a playground is shown on the results panel.
// By default the first 20 documents will be returned with a cursor.
// Use 'console.log()' to print to the debug output.
// For more documentation on playgrounds please refer to
// https://www.mongodb.com/docs/mongodb-vscode/playgrounds/

// Select the database to use.
use('supplies');
db.getName();

//ej1) Buscar las ventas realizadas en "London", "Austin" o "San Diego"; a un customer con
// edad mayor-igual a 18 años que tengan productos que hayan salido al menos 1000
// y estén etiquetados (tags) como de tipo "school" o "kids" (pueden tener más etiquetas).
// Mostrar el id de la venta con el nombre "sale", la fecha (“saleDate"), el storeLocation,
// y el "email del cliente. No mostrar resultados anidados.

// con find pero no puedo lograr el aplanamiento
/*cuando los valores de campos como incluyen subcampos como "$...." en formato BSON,
no es posible acceder a estos subcampos directamente en una proyección con find*/

db.sales.find(
    { 
        storeLocation: { $in: ["London", "Austin", "San Diego"] },
        "customer.age": { $gte: 18 },
        items: {
            $elemMatch: {
                price: { $gte: 1000 },
                tags: { $in: ["school", "kids"] }
            }
        }
    },
    {
        _id: 0,
        sale: "$_id",
        saleDate: 1,
        storeLocation: 1,
        customerEmail: "$customer.email"
    }
)

// si quisiera productos exclusicamente con 2 tags

db.sales.find(
    { 
        storeLocation: { $in: ["London", "Austin", "San Diego"] },
        "customer.age": { $gte: 18 },
        items: {
            $elemMatch: {
                price: { $gte: 1000 },
                tags: { $all: ["school", "kids"], $size: 2 } // Solo etiquetas 'school' y 'kids', sin más etiquetas
            }
        }
    },
    {
        sale: "$_id",
        saleDate: 1,
        storeLocation: 1,
        "customer.email": 1,
        _id: 0
    }
)

// con aggregate se puede aplanar !!!!

db.sales.aggregate([
    { 
        $match: { 
            storeLocation: { $in: ["London", "Austin", "San Diego"] },
            "customer.age": { $gte: 18 },
            items: {
                $elemMatch: {
                    price: { $gte: 1000 },
                    tags: { $in: ["school", "kids"] } 
                }
            }
        }
    },
    {
        $project: {
            _id: 0,
            sale: { $toString: "$_id" },
            saleDate: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$saleDate" } },
            storeLocation: 1,
            customerEmail: "$customer.email" 
        }  
    }
]);

//ej2: Buscar las ventas de las tiendas localizadas en Seattle, donde el método de compra
// sea ‘In store’ o ‘Phone’ y se hayan realizado entre 1 de febrero de 2014 y 31 de enero
// de 2015 (ambas fechas inclusive). Listar el email y la satisfacción del cliente, y el
// monto total facturado, donde el monto de cada item se calcula como 'price *
// quantity'. Mostrar el resultado ordenados por satisfacción (descendente), frente a
// empate de satisfacción ordenar por email (alfabético).

db.sales.aggregate([
    { 
        $match: { 
            storeLocation: "Seattle",  // Filtramos por ubicación
            purchaseMethod: { $in: ["In store", "Phone"] },  // Filtramos por métodos de compra
            saleDate: { 
                $gte: ISODate("2014-02-01T00:00:00.000Z"), 
                $lte: ISODate("2015-01-31T23:59:59.999Z") 
            }  // Filtramos por fecha
        }
    },
    {
        $addFields: {
            totalAmount: {
                $sum: {
                    $map: {
                        input: "$items",  // Iteramos sobre el array de items
                        as: "item",
                        in: {
                            $multiply: [
                                { $toDecimal: "$$item.price" },  // Convertimos el precio de cada item a decimal
                                "$$item.quantity"  // Multiplicamos por la cantidad
                            ]
                        }
                    }
                }
            }
        }
    },
    { 
        $project: {
            _id: 0,
            customerEmail: "$customer.email",  // Email del cliente
            customerSatisfaction: "$customer.satisfaction",  // Satisfacción del cliente
            totalAmount: { $toDouble: "$totalAmount" }  // Mostramos el monto total calculado aplanado
        }
    },
    { 
        $sort: {
            customerSatisfaction: -1,  // Ordenamos por satisfacción (descendente)
            customerEmail: 1  // En caso de empate, ordenamos por email (alfabéticamente)
        }
    }
]);

// otra forma (salchi)
db.sales.aggregate([
    { 
        $match: { 
            "storeLocation": "Seattle",
            "purchaseMethod": { $in: ["In store", "Phone"] },
            "saleDate": { 
                            $gte: ISODate("2014-02-01T00:00:00Z"), 
                            $lte: ISODate("2015-01-31T23:59:59Z") 
                        }
        }
    },
    {
        $unwind: "$items"
    },
    {
        $addFields: {
            itemCost: { $multiply: ["$items.price", "$items.quantity"] }
        }
    },
    {
        $group: {
            _id: "$_id",
            customerEmail: { $first: "$customer.email" },
            customerSatisfaction: { $first: "$customer.satisfaction" },
            totalCost: { $sum: "$itemCost" }
        }
    },
    {
        $project: {
        _id: 0,
        customerEmail: 1,
        customerSatisfaction: 1,
        totalCost: { $toDouble: "$totalCost" }
        }
    },
    {
        $sort: { 
            customerSatisfaction: -1,
            customerEmail: 1
        }
    }
]);

//ej3: Crear la vista salesInvoiced que calcula el monto mínimo, monto máximo, monto total
// y monto promedio facturado por año y mes. Mostrar el resultado en orden cronológico.
// No se debe mostrar campos anidados en el resultado

db.createView("salesInvoiced", "sales", [
    // 1. Extraer el año y el mes de la fecha de venta
    {
        $addFields: {
            saleYear: { $year: "$saleDate" },
            saleMonth: { $month: "$saleDate" }
        }
    },
    // 2. Deshacer el array de items para procesarlos individualmente
    {
        $unwind: "$items"
    },
    // 3. Calcular los valores agregados por año y mes
    {
        $group: {
            _id: { year: "$saleYear", month: "$saleMonth" },  // Agrupar por año y mes
            minAmount: { $min: { $multiply: [{ $toDecimal: "$items.price" }, "$items.quantity"] } },  // Monto mínimo
            maxAmount: { $max: { $multiply: [{ $toDecimal: "$items.price" }, "$items.quantity"] } },  // Monto máximo
            totalAmount: { $sum: { $multiply: [{ $toDecimal: "$items.price" }, "$items.quantity"] } },  // Monto total
            avgAmount: { $avg: { $multiply: [{ $toDecimal: "$items.price" }, "$items.quantity"] } }  // Monto promedio
        }
    },
    // 4. Aplanar el resultado
    {
        $project: {
            _id: 0,  // No mostrar el campo _id
            year: "$_id.year",  // Año
            month: "$_id.month",  // Mes
            minAmount: { $toDouble: "$minAmount" },
            maxAmount: { $toDouble: "$maxAmount" },
            totalAmount: { $toDouble: "$totalAmount" },
            avgAmount: { $round: [{ $toDouble: "$avgAmount" }, 3] }  // Redondear avgAmount a 3 decimales solo porque quiero
        }
    },
    // 5. Ordenar el resultado por año y mes (en orden cronológico)
    {
        $sort: { 
            year: 1,  // Ascendente por año
            month: 1  // Ascendente por mes
        }
    }
]);

// ver la vista
db.salesInvoiced.find();

// eliminar la vista (si necesito modificarla tengo que borra la existente)
db.salesInvoiced.drop();

//ej4: Mostrar el storeLocation, la venta promedio de ese local,
// el objetivo a cumplir de ventas (dentro de la colección storeObjectives)
// y la diferencia entre el promedio y el objetivo de todos los locales.

db.sales.aggregate([
    {
        $unwind: "$items"  // Desenrollamos el array de 'items' para poder trabajar con cada producto por separado
    },
    {
        $group: {
            _id: "$storeLocation",  // Agrupamos por la tienda
            totalSales: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },  // Calculamos el total de ventas por tienda
            totalItems: { $sum: 1 }  // Contamos el número de elementos en el array 'items' (ventas)
        }
    },
    {
        $project: {
            storeLocation: "$_id",  // Renombramos el campo _id a storeLocation
            avgSale: { $divide: ["$totalSales", "$totalItems"] }  // Calculamos la venta promedio dividiendo el total de ventas por la cantidad de items
        }
    },
    {
        $lookup: {
            from: "storeObjectives",  // Realizamos el join con la colección storeObjectives
            localField: "storeLocation",  // Campo de storeLocation en la colección sales
            foreignField: "_id",  // Campo _id en la colección storeObjectives
            as: "objectiveData"  // El resultado del join lo guardamos en un campo llamado 'objectiveData'
        }
    },
    {
        $unwind: "$objectiveData"  // Desenrollamos el array 'objectiveData' para poder acceder a los datos de forma directa
    },
    {
        $project: {
            storeLocation: 1,  // Mantenemos el storeLocation
            avgSale: { $toDouble: "$avgSale" },  // Mantenemos la venta promedio
            objective: "$objectiveData.objective",  // Extraemos el objetivo de la venta
            diffFromObjective: { $toDouble: { $subtract: ["$avgSale", "$objectiveData.objective"] } }  // Calculamos la diferencia entre el promedio y el objetivo
        }
    }
]);

// otra forma (salchi)

db.sales.aggregate( [
    {
      $unwind: "$items"
    },
    {
      $addFields: {
            itemAmount: { $multiply: ["$items.price", "$items.quantity"] }
        }
    },
    {
      $group: {
        _id: { storeLocation: "$storeLocation" },
        avgAmount: { $avg: "$itemAmount" }   
      }
    },
    {
      $project: {
        _id: 0,                  
        storeLocation: "$_id.storeLocation"  , 
        avgAmount: "$avgAmount"
      }
    },
    {
        $lookup: {
            from: "storeObjectives",
            localField: "storeLocation",
            foreignField: "_id", 
            as: "objectiveData"
        }
    },
    {
        $unwind: "$objectiveData"
    },
    {
        $project: {
            storeLocation: 1,
            avgAmount: { $toDouble: "$avgAmount" },
            objective: "$objectiveData.objective",
            diffFromObjective: { $toDouble: { $subtract: ["$avgAmount", "$objectiveData.objective"] } }
        }
    }
]);

//ej5: Especificar reglas de validación en la colección sales utilizando JSON Schema.
// Las reglas se deben aplicar sobre los campos: saleDate, storeLocation, 
// purchaseMethod, y customer ( y todos sus campos anidados).
// Inferir los tipos y otras restricciones que considere adecuados para especificar
// las reglas a partir de los documentos de la colección.

db.runCommand({
    collMod: "sales",
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["saleDate", "storeLocation", "purchaseMethod", "customer"],
            properties: {
                saleDate: {
                    bsonType: "date",
                    description: "must be a date and is required"
                },
                storeLocation: {
                    bsonType: "string",
                    description: "must be a non-empty string and is required",
                    minLength: 1  // Asegura que no esté vacío
                },
                purchaseMethod: {
                    bsonType: "string",
                    description: "must be a string representing the purchase method",
                    // enum: ["In store", "Online"]  Restringe los valores válidos
                },
                customer: {
                    bsonType: "object",
                    required: ["email"],
                    properties: {
                        gender: {
                            bsonType: "string",
                            description: "must be 'F' or 'M'",
                            enum: ["F", "M"]  // Restringe los valores válidos
                        },
                        age: {
                            bsonType: "int",
                            description: "must be an integer greater than 0",
                            minimum: 12  // Restricción para que sea mayor que 0
                        },
                        email: {
                            bsonType: "string",
                            description: "must be a valid email address and is required",
                            pattern: "^(.*)@(.*)\\.(.{2,4})$"  // Expresión regular para validar el correo electrónico
                        },
                        satisfaction: {
                            bsonType: "int",
                            description: "must be an integer representing customer satisfaction",
                            minimum: 1,  // Restricción para valores entre 1 y 5
                            maximum: 5
                        }
                    }
                },
                /*
                items: {
                    bsonType: "array",
                    description: "must be an array of items",
                    items: {
                        bsonType: "object",
                        required: ["name", "price", "quantity"],
                        properties: {
                            name: {
                                bsonType: "string",
                                description: "must be a string"
                            },
                            price: {
                                bsonType: "numberDecimal",
                                description: "must be a number representing the price"
                            },
                            quantity: {
                                bsonType: "int",
                                description: "must be an integer representing the quantity"
                            }
                        }
                    }
                }
                */
            }
        }
    }
});

// Para testear las reglas de validación crear un caso de falla y uno de éxito

// caso exitoso
db.sales.insertOne({
    saleDate: new Date(),
    storeLocation: "Pilar",
    purchaseMethod: "Efectivo",
    customer: {
        gender: "F",
        email: "jazbd@gmail.com",
        satisfaction: 3
    },
    items: [
        {
          name: "envelopes",
          tags: [
            "stationary",
            "office",
            "general"
          ],
          price: NumberDecimal("17.02"),
          quantity: 7
        },
        {
          name: "notepad",
          tags: [
            "office",
            "writing",
            "school"
          ],
          price: NumberDecimal("11.92"),
          "quantity": 5
        },
    ],
});

// caso falla
db.sales.insertOne({
    saleDate: new Date(),
    storeLocation: "Pilar",
    purchaseMethod: "Efectivo",
    customer: {
        gender: "F",
        email: "jazbd@gmail.com",
        satisfaction: 10
    },
    items: [
        {
          name: "envelopes",
          tags: [
            "stationary",
            "office",
            "general"
          ],
          price: NumberDecimal("17.02"),
          quantity: 7
        },
        {
          name: "notepad",
          tags: [
            "office",
            "writing",
            "school"
          ],
          price: NumberDecimal("11.92"),
          "quantity": 5
        },
    ],
});