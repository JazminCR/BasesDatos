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
use('analytics');
db.getName();

//ej1: Buscar los clientes que no tengan el campo active y que o bien posean más de 4 cuentas
// o bien nacieron entre Abril de 1995 y Marzo de 1997 inclusives.
// Listar el nombre, email, fecha de nacimiento y cantidad de cuentas.
// Limitar el resultado a los 50 primeros clientes  de acuerdo al orden alfabético.

db.customers.aggregate([
    // Filtrar clientes que no tengan el campo 'active' y que cumplan con alguna de las otras dos condiciones
    {
      $match: {
        active: { $exists: false },
        $or: [
          { "accounts.4": { $exists: true } }, // Más de 4 cuentas
          { 
            birthdate: {
              $gte: ISODate("1995-04-01T00:00:00Z"),  // Nacimiento después de abril de 1995
              $lte: ISODate("1997-03-31T23:59:59Z")   // Nacimiento antes de marzo de 1997
            }
          }
        ]
      }
    },
    // Proyectar solo los campos que nos interesan
    {
      $project: {
        _id: 0,
        name: 1,
        email: 1,
        birthdate: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$birthdate" } },
        accountsCount: { $size: "$accounts" }  // Contar la cantidad de cuentas
      }
    },
    // Limitar los resultados a los primeros 50 clientes
    {
      $limit: 50
    },
    // Ordenar los resultados alfabéticamente por el nombre del cliente
    {
      $sort: { name: 1 }
    }
]);
  
//ej2: Actualizar las cuentas que tengan un límite entre 8000 y 9000 inclusives,
// agregando un nuevo campo "class" con el valor "A" si la cuenta tiene hasta dos productos
// y con el valor "B" si tiene 3 o más productos.

db.accounts.updateMany(
    { 
      limit: { $gte: 8000, $lte: 9000 } // Filtra los documentos que cumplan con el rango de límite
    },
    [
      {
        $set: {
          class: {
            $switch: {
              branches: [
                // Compara la longitud del array 'products' y asigna la clase según el tamaño
                { case: { $lte: [{ $size: "$products" }, 2] }, then: "A" },
                { case: { $gte: [{ $size: "$products" }, 3] }, then: "B" }
              ],
              default: "Unknown" // Si no se cumple ninguna condición, asigna "Unknown"
            }
          }
        }
      }
    ]
);

//ej3: Buscar las transacciones donde la cantidad de transacciones sea mayor a 94.
// Listar id de transacción, id de la cuenta, y solo aquellas transacciones que tengan el
// código de transacción igual a "buy" y con "total" mayor a 500000.
// Mostrar el resultado ordenados por el id de la cuenta en orden decreciente.
// HINTS: (i) El operador $filter puede ser de utilidad.
// (ii) Notar que el valor del campo total está en string y requiere conversión.
  
db.transactions.aggregate([
    {
        // Filtrar los documentos donde transaction_count sea mayor a 94
        $match: {
            transaction_count: { $gt: 94 }
        }
    },
    {
        // modificar el documento y solo mantener las transacciones relevantes
        $project: {
            _id: 0,
            transaction_id: { $toString: "$_id" },
            account_id: 1, // Mantener el account_id
            transactions: {
                // extraer las transacciones que sean "buy" y tengan un total mayor a 500000
                $filter: {
                    input: "$transactions", // La lista de transacciones a filtrar
                    as: "transaction", // Alias para cada elemento de la lista
                    cond: {
                        // Condición que debe cumplir cada transacción
                        $and: [
                            { $eq: ["$$transaction.transaction_code", "buy"] }, // Transacción de tipo "buy"
                            { 
                                // Convertir el campo "total" (que es un string) a número y compararlo con 500000
                                $gt: [{ $toDouble: "$$transaction.total" }, 500000]
                            }
                        ]
                    }
                }
            }
        }
    },
    {
        // Ordenar los resultados por account_id de manera descendente
        $sort: { account_id: -1 }
    }
]);

// si quisiera filtrar algunos campos de cada transacción

db.transactions.aggregate([
    {
        // Filtrar los documentos donde transaction_count sea mayor a 94
        $match: {
            transaction_count: { $gt: 94 }
        }
    },
    {
        // Modificar el documento y solo mantener las transacciones relevantes
        $project: {
            _id: 0,
            transaction_id: { $toString: "$_id" },
            account_id: 1, // Mantener el account_id
            transactions: {
                // Filtrar las transacciones que sean "buy" y tengan un total mayor a 500000
                $map: {
                    input: {
                        $filter: {
                            input: "$transactions", // La lista de transacciones a filtrar
                            as: "transaction", // Alias para cada elemento de la lista
                            cond: {
                                // Condición que debe cumplir cada transacción
                                $and: [
                                    { $eq: ["$$transaction.transaction_code", "buy"] }, // Transacción de tipo "buy"
                                    { 
                                        // Convertir el campo "total" (que es un string) a número y compararlo con 500000
                                        $gt: [{ $toDouble: "$$transaction.total" }, 500000]
                                    }
                                ]
                            }
                        }
                    },
                    as: "filtered_transaction",
                    in: {
                        // Proyectar solo los campos que necesitamos de cada transacción
                        date: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$$filtered_transaction.date" } },
                        transaction_code: "$$filtered_transaction.transaction_code", // Ejemplo de otro campo
                        amount: "$$filtered_transaction.amount" // Otro ejemplo de campo a proyectar
                    }
                }
            }
        }
    },
    {
        // Ordenar los resultados por account_id de manera descendente
        $sort: { account_id: -1 }
    }
]);

//ej4: Crear la vista "transactionCountByCode" que lista el id de transacción, id de la cuenta,
// cantidad de transacciones, cantidad de transacciones de compra (transacciones con transaction_code igual a buy)
// y cantidad de transacciones de venta (transacciones con transaction_code igual a sell).
// Listar el resultado ordenados por cantidad de transacciones (orden decreciente)

db.createView("transactionCountByCode", "transactions", [
    {
        // Fase de project para crear los campos que necesitamos
        $project: {
            _id: 1, // Mantener el _id original de la transacción
            account_id: 1, // Mantener el account_id
            transaction_count: 1, // Mantener el campo transaction_count
            transactions: 1, // Mantener el array de transacciones
        }
    },
    {
        // Fase de addFields para calcular las transacciones de compra y venta
        $addFields: {
            buy_count: {
                // Contamos las transacciones de tipo "buy"
                $size: {
                    $filter: {
                        input: "$transactions", // El array de transacciones
                        as: "transaction", // Alias para cada transacción
                        cond: { $eq: ["$$transaction.transaction_code", "buy"] } // Condición para transacciones de compra
                    }
                }
            },
            sell_count: {
                // Contamos las transacciones de tipo "sell"
                $size: {
                    $filter: {
                        input: "$transactions", // El array de transacciones
                        as: "transaction", // Alias para cada transacción
                        cond: { $eq: ["$$transaction.transaction_code", "sell"] } // Condición para transacciones de venta
                    }
                }
            }
        }
    },
    {
        // Fase de project para estructurar el documento final de la vista
        $project: {
            _id: 0, // No mostrar el _id original
            transaction_id: { $toString: "$_id" }, // Convertir el _id en un string para mostrarlo como transaction_id
            account_id: 1, // Incluir el account_id
            total_transactions: "$transaction_count", // Mantener el total de transacciones
            buy_count: 1, // Mostrar la cantidad de transacciones de compra
            sell_count: 1, // Mostrar la cantidad de transacciones de venta
        }
    },
    {
        // Ordenar los resultados por la cantidad total de transacciones de manera descendente
        $sort: { total_transactions: -1 }
    }
]);

//ej5: Calcular la suma total, suma total de ventas y suma total de compras de las
// transacciones realizadas por año y mes. Mostrar el resultado en orden cronológico.
// No se debe mostrar resultados anidados en el resultado.
// HINT: El operador $cond o $switch puede ser de utilidad.

db.transactions.aggregate([
    {
        // Desglosamos las transacciones para poder agrupar por año y mes
        $unwind: "$transactions"
    },
    {
        // Creamos un campo 'yearMonth' con el año y mes de la fecha de la transacción
        $addFields: {
            yearMonth: {
                $dateToString: {
                    format: "%Y-%m", // Año y mes con formato "YYYY-MM"
                    date: "$transactions.date"
                }
            }
        }
    },
    {
        // Agrupamos por 'yearMonth', sumando los valores de las transacciones
        $group: {
            _id: "$yearMonth", // El identificador será el año y mes
            totalAmount: { $sum: { $toDouble: "$transactions.total" } }, // Suma total de todas las transacciones
            totalBuy: { 
                $sum: {
                    $cond: [
                        { $eq: ["$transactions.transaction_code", "buy"] }, // Si la transacción es 'buy'
                        { $toDouble: "$transactions.total" }, // Sumar el total de las compras
                        0 // Si no es 'buy', no sumar
                    ]
                }
            },
            totalSell: { 
                $sum: {
                    $cond: [
                        { $eq: ["$transactions.transaction_code", "sell"] }, // Si la transacción es 'sell'
                        { $toDouble: "$transactions.total" }, // Sumar el total de las ventas
                        0 // Si no es 'sell', no sumar
                    ]
                }
            }
        }
    },
    {
        // Convertimos el campo 'totalAmount', 'totalBuy' y 'totalSell' a números
        $project: {
            _id: 0, // Excluimos el campo _id de la proyección
            yearMonth: "$_id", // Incluimos el 'yearMonth' como campo
            totalAmount: 1, // Incluir la suma total de todas las transacciones
            totalBuy: 1, // Incluir la suma de las compras
            totalSell: 1 // Incluir la suma de las ventas
        }
    },
    {
        // Ordenamos el resultado cronológicamente (por año y mes)
        $sort: { yearMonth: 1 }
    }
]);

//ej6: Especificar reglas de validación en la colección transactions
// (a) usando JSON Schema a los campos: account_id, transaction_count,
// bucket_start_date, bucket_end_date y transactions (y todos sus campos anidados).
// Inferir los tipos y otras restricciones que considere adecuados para especificar las reglas a partir de los documentos de la colección.
// (b) Luego añadir una regla de validación tal que bucket_start_date debe ser menor o igual a bucket_end_date.
// (c) Testear la regla de validación generando dos casos de falla y dos de éxito.
// Los casos no deben ser triviales.

db.runCommand({
    collMod: "transactions", // Nombre de la colección
    validator: {
      "$and": [
        // Validación con operadores de consulta
        {
          "$expr": {
            "$lt": ["$bucket_start_date", "$bucket_end_date"]
          }
        },
        {
          $jsonSchema: {
            bsonType: "object",
            required: ["account_id", "transaction_count", "bucket_start_date", "bucket_end_date", "transactions"],
            properties: {
              "account_id": {
                bsonType: "int",
                description: "Debe ser un número entero"
              },
              "transaction_count": {
                bsonType: "int",
                minimum: 0,
                description: "Debe ser un número entero mayor o igual a 0"
              },
              "bucket_start_date": {
                bsonType: "date",
                description: "Debe ser una fecha válida"
              },
              "bucket_end_date": {
                bsonType: "date",
                description: "Debe ser una fecha válida"
              },
              "transactions": {
                bsonType: "array",
                minItems: 1,
                items: {
                  bsonType: "object",
                  required: ["date", "amount", "transaction_code", "symbol", "price", "total"],
                  properties: {
                    "date": {
                      bsonType: "date",
                      description: "Debe ser una fecha válida"
                    },
                    "amount": {
                      bsonType: "int",
                      minimum: 0,
                      description: "Debe ser un número entero mayor o igual a 0"
                    },
                    "transaction_code": {
                      bsonType: "string",
                      enum: ["buy", "sell"], // Opciones posibles para el código de transacción
                      description: "Debe ser 'buy' o 'sell'"
                    },
                    "symbol": {
                      bsonType: "string",
                      description: "Debe ser una cadena de texto (símbolo de la transacción)"
                    },
                    "price": {
                      bsonType: "string",
                      description: "Debe ser una cadena de texto que representa un número"
                    },
                    "total": {
                      bsonType: "string",
                      description: "Debe ser una cadena de texto que representa un número"
                    }
                  }
                }
              }
            }
          }
        }
      ]
    },
    validationAction: "error", // Acciones que se tomarán si la validación falla, "error" evita la inserción
    validationLevel: "strict" // Asegura que los documentos nuevos sean validados
  });
  

// casos de prueba falla por las fechas
db.transactions.insertOne({
    account_id: 1,
    transaction_count: 200,
    bucket_start_date: new Date(),
    bucket_end_date: new Date(),
    transactions: [
        {
          date: new Date(),
          amount: 2000,
          transaction_code: "buy",
          symbol: "ni idea",
          price: "1234567",
          total: "99999999"
        },
        {
            date: new Date(),
            amount: 2000,
            transaction_code: "sell",
            symbol: "ni idea",
            price: "1234567",
            total: "99999999"
          },
    ],
});

// casos de prueba exitoso
db.transactions.insertOne({
    account_id: 1,
    transaction_count: 200,
    bucket_start_date: new Date("2024-12-27T00:00:00Z"),
    bucket_end_date: new Date("2026-12-27T00:00:00Z"),
    transactions: [
        {
          date: new Date(),
          amount: 2000,
          transaction_code: "buy",
          symbol: "ni idea",
          price: "1234567",
          total: "99999999"
        },
        {
            date: new Date(),
            amount: 2000,
            transaction_code: "sell",
            symbol: "ni idea",
            price: "1234567",
            total: "99999999"
          },
    ],
});