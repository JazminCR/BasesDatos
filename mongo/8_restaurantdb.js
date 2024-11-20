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

db.getName();

db.restaurants.findOne()

//ej10: Listar el id del restaurante (restaurant_id) y las calificaciones de los restaurantes
// donde al menos una de sus calificaciones haya sido realizada entre 2014 y 2015 inclusive,
// y que tenga una puntuación (score) mayor a 70 y menor o igual a 90

db.restaurants.find(
    {
      // Filtrar por las calificaciones que tengan una fecha entre 2014 y 2015
      grades: {
        $elemMatch: {
          date: {
            $gte: ISODate("2014-01-01T00:00:00Z"), // Fecha mínima
            $lte: ISODate("2015-12-31T23:59:59Z") // Fecha máxima
          },
          score: {
            $gt: 70,   // Puntuación mayor a 70
            $lte: 90   // Puntuación menor o igual a 90
          }
        }
      }
    },
    {
      // Proyección para incluir solo el restaurant_id y grades
      restaurant_id: 1, // Incluir el campo restaurant_id
      grades: 1,        // Incluir el campo grades
      _id: 0            // Excluir el campo _id
    }
);
  

//ej11: Agregar dos nuevas calificaciones al restaurante cuyo id es "50018608"

db.restaurants.updateOne(
    { restaurant_id: "50018608" }, // Filtro para encontrar el restaurante específico
    {
      $push: {
        grades: {
          $each: [ // Usar $each para agregar múltiples elementos a la vez
            {
              date: ISODate("2019-10-10T00:00:00Z"), // Primera calificación
              grade: "A",
              score: 18
            },
            {
              date: ISODate("2020-02-25T00:00:00Z"), // Segunda calificación
              grade: "A",
              score: 21
            }
          ]
        }
      }
    }
);
  
// para chequear

db.restaurants.find(
    { restaurant_id: "50018608" }, // Filtro para encontrar el restaurante específico
    { grades: 1, _id: 0 } // Proyección para mostrar solo el array de calificaciones y excluir el campo _id
);
  
//ej12p2: Listar el id y nombre de los restaurantes junto con su puntuación máxima, 
// mínima y la suma total. Se puede asumir que el restaurant_id es único.

//Resolver con $group y accumulators.
//usamos $group para agrupar por restaurant_id y calcular los valores requeridos.

db.restaurants.aggregate([
  {
    $unwind: "$grades" // Descomponemos el array de calificaciones
  },
  {
    $group: {
      _id: "$restaurant_id",
      name: { $first: "$name" }, // Obtenemos el nombre del restaurante
      maxScore: { $max: "$grades.score" }, // Máxima puntuación
      minScore: { $min: "$grades.score" }, // Mínima puntuación
      totalScore: { $sum: "$grades.score" } // Suma total de las puntuaciones
    }
  },
  {
    $project: {
      _id: 1,
      name: 1,
      maxScore: 1,
      minScore: 1,
      totalScore: 1
    }
  }
]);

//Resolver con expresiones sobre arreglos (por ejemplo, $sum) pero sin $group.

db.restaurants.aggregate([
  {
    $project: {
      _id: "$restaurant_id",
      name: "$name",
      maxScore: { $max: "$grades.score" }, // Máxima puntuación
      minScore: { $min: "$grades.score" }, // Mínima puntuación
      totalScore: { $sum: "$grades.score" } // Suma total de las puntuaciones
    }
  }
]);

//Resolver como en el punto b) pero usar $reduce para calcular la puntuación total.

db.restaurants.aggregate([
  {
    $project: {
      _id: "$restaurant_id",
      name: "$name",
      maxScore: { $max: "$grades.score" }, // Máxima puntuación
      minScore: { $min: "$grades.score" }, // Mínima puntuación
      totalScore: {
        $reduce: {
          input: "$grades",
          initialValue: 0,
          in: { $add: ["$$value", "$$this.score"] } // Suma las puntuaciones usando reduce
        }
      }
    }
  }
]);

//Resolver con find.

const restaurants = db.restaurants.find({}, { restaurant_id: 1, name: 1, grades: 1 }).toArray();

// Procesar en el código para calcular min, max y total
restaurants.forEach(restaurant => {
  const scores = restaurant.grades.map(grade => grade.score);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const totalScore = scores.reduce((acc, score) => acc + score, 0);

  console.log({
    restaurant_id: restaurant.restaurant_id,
    name: restaurant.name,
    maxScore,
    minScore,
    totalScore
  });
});

// otra forma

db.restaurants.find({}, {
  restaurant_id: 1,
  name: 1,
  grades: 1
}).forEach(function(restaurant) {
  let scores = restaurant.grades.map(grade => grade.score); // Extrae las puntuaciones
  let maxScore = Math.max(...scores); // Obtiene la puntuación máxima
  let minScore = Math.min(...scores); // Obtiene la puntuación mínima
  let totalScore = scores.reduce((acc, score) => acc + score, 0); // Suma total de las puntuaciones
  
  printjson({
      restaurant_id: restaurant.restaurant_id,
      name: restaurant.name,
      maxScore: maxScore,
      minScore: minScore,
      totalScore: totalScore
  });
});

// no se pueden realizar cálculos con find por eso quedan raros

//ej13p2: Actualizar los datos de los restaurantes añadiendo dos campos nuevos. 
// "average_score": con la puntuación promedio, 
//"grade": con "A" si "average_score" está entre 0 y 13, con "B" si está entre 14 y 27, con "C" si es mayor o igual a 28    
// Se debe actualizar con una sola query.
// HINT1. Se puede usar pipeline de agregación con la operación update
// HINT2. El operador $switch o $cond pueden ser de ayuda.

// con switch

db.restaurants.updateMany(
  {}, // Selecciona todos los documentos
  [
    {
      $set: {
        average_score: {
          $avg: "$grades.score" // Calcula la puntuación promedio de las calificaciones
        },
        grade: {
          $switch: {
            branches: [
              { case: { $lte: [{ $avg: "$grades.score" }, 13] }, then: "A" },
              { case: { $and: [{ $gt: [{ $avg: "$grades.score" }, 13] }, { $lte: [{ $avg: "$grades.score" }, 27] }] }, then: "B" },
              { case: { $gt: [{ $avg: "$grades.score" }, 27] }, then: "C" }
            ],
            default: "Unknown" // Un caso por defecto en caso de que no se cumpla ninguna condición
          }
        }
      }
    }
  ]
);

// con cond

db.restaurants.updateMany(
  {}, // Selecciona todos los documentos
  [
    {
      $set: {
        average_score: {
          $avg: "$grades.score" // Calcula la puntuación promedio de las calificaciones
        },
        grade: {
          $cond: [
            { $lte: [{ $avg: "$grades.score" }, 13] }, "A", // Si average_score <= 13
            { $cond: [
                { $lte: [{ $avg: "$grades.score" }, 27] }, "B", // Si average_score <= 27
                "C" // Si average_score > 27
              ]
            }
          ]
        }
      }
    }
  ]
);

// para chequear

db.restaurants.find({}, { restaurant_id: 1, name: 1, average_score: 1, grade: 1 }).pretty();

db.restaurants.find(
  { "average_score": { $exists: true } }, 
  { restaurant_id: 1, name: 1, average_score: 1, grade: 1 }
).pretty();
