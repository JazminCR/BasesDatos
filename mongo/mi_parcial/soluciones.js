use('university');
db.getName();

// ej1

db.grades.find(
    {
        $and: [
            {
                $or: [
                    { "scores": { $elemMatch: { "type": "exam", "score": { $gte: 80 } } } },
                    { "scores": { $elemMatch: { "type": "quiz", "score": { $gte: 90 } } } }
                ]
            },
            {
            "scores": {
                $not: {
                    $elemMatch: { "type": "homework", "score": { $lt: 60 } }
                }
            }
            }
        ]
    },
    {
        "_id": 0
    }
).sort({ "class_id": -1, "student_id": 1 })
  

// ej2

db.grades.aggregate([
    {
        $match: { "class_id": { $in: [20, 220, 420] } }
    },
    {
        $unwind: "$scores"
    },
    {
        $group: {
            _id: { student_id: "$student_id", class_id: "$class_id" },
            minScore: { $min: "$scores.score" },
            avgScore: { $avg: "$scores.score" },
            maxScore: { $max: "$scores.score" }
        }
    },
    {
        $sort: { "_id.student_id": 1, "_id.class_id": 1 }
    }
])
  
// ej3

db.grades.aggregate([
    {
        $unwind: "$scores"
    },
    {
        $match: { "scores.type": { $in: ["exam", "quiz"] } }
    },
    {
        $group: {
            _id: { class_id: "$class_id", type: "$scores.type" },
            maxScore: { $max: "$scores.score" }
        }
    },
    {
        $group: {
            _id: "$_id.class_id",
            maxExamScore: {
                $max: {
                    $cond: [{ $eq: ["$_id.type", "exam"] }, "$maxScore", null]
                }
            },
            maxQuizScore: {
                $max: {
                    $cond: [{ $eq: ["$_id.type", "quiz"] }, "$maxScore", null]
                }
            }
        }
    },
    {
        $sort: { "_id": 1 }
    }
])
  
// ej4

db.createView("top10students", "grades", [
    {
        $unwind: "$scores"
    },
    {
        $group: {
            _id: { student_id: "$student_id" },
            avgScore: { $avg: "$scores.score" } 
        }
    },
    {
        $project: {
            _id: 0, 
            student_id: "$student_id",
            avgScore: { $toDouble: "$avgScore" },
        }
    },
    {
        $sort: { 
            avgScore: -1,
        }
    },
    {
        $limit: 10
    }
]);

// ej5

db.grades.updateMany(
    { class_id: 339},
    [
      {
        $set: {
          score_avg: {
            $avg: "$scores.score" // calcula la puntuación promedio de las calificaciones
          },
          letter: {
            $switch: {
              branches: [
                { case: { $and: [{ $gte: [{ $avg: "$scores.score" }, 0] }, { $lt: [{ $avg: "$scores.score" }, 60] }] }, then: "NA" },
                { case: { $and: [{ $gte: [{ $avg: "$scores.score" }, 60] }, { $lt: [{ $avg: "$scores.score" }, 80] }] }, then: "A" },
                { case: { $and: [{ $gte: [{ $avg: "$scores.score" }, 80] }, { $lte: [{ $avg: "$scores.score" }, 100] }] }, then: "P" }
              ],
              default: "Unknown" // un caso por defecto en caso de que no se cumpla ninguna condición
            }
          }
        }
      }
    ]
);

// ej6

db.runCommand({
    collMod: "grades",
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["student_id", "scores", "class_id"],
            properties: {
                student_id: {
                    bsonType: "int",
                    description: "must be a int and is required"
                },
                scores: {
                    bsonType: "object",
                    required: ["type", "score"],
                    properties: {
                        type: {
                            bsonType: "string",
                            description: "must be a string",
                            enum: ["quiz", "exam", "homework"]
                        },
                        score: {
                            bsonType: "double",
                            minimum: 0,
                            maximum: 100,
                            description: "must be a numbre greater than 0",
                            
                        }
                    }
                },
                class_id: {
                    bsonType: "int",
                    description: "must be a int and is required",
                },
            }
        }
    }
});

db.getCollectionInfos({ name: "grades" });

// caso 1: falla porque el valor del campo score se pasa como string y debe ser un número
db.grades.insertOne({
    student_id: 1,
    scores: [
        {
            type: "exam",
            score: "78",
        },
        {
            type: "quiz",
            score: 78,
          },
    ],
    class_id: 5,
});

// caso 2: falla porque en type se pasa un string que no está permitido
db.grades.insertOne({
    student_id: 1,
    scores: [
        {
            type: "exam",
            score: 60,
        },
        {
            type: "hola",
            score: 8,
          },
    ],
    class_id: 5,
});

// caso 3: es exitoso
db.grades.insertOne({
    student_id: 1,
    scores: [
        {
            type: "exam",
            score: 78,
        },
        {
            type: "quiz",
            score: 92.5577,
          },
    ],
    class_id: 5,
});