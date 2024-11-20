// Select the database to use.
use('mflix');
db.getName();

db.getCollection('users').findOne()

//ej1: Insert a few documents into the users collection.
db.getCollection('users').insertMany([
    {name: 'Jaz',email: 'jaz@gmail.com',password: '$quieroaprobar'},
    {name: 'Jaz',email: 'jazfacu@unc.edu',password: '$quieroaprobar2'},
    {name: 'Guada',email: 'guada@gmail.com',password: '$quieroaprobar3'},
    {name: 'Marti',email: 'marti@gmail.com',password: '$quieroaprobar4'},
    {name: 'Ivo',email: 'ivo@gmail.com',password: '$quieroaprobar5'},
]);

db.getCollection('users').find({ name: "Jaz" })

db.getCollection('comments').insertMany([
    {"name": "Jaz", "email": "jaz@gmail.com", "text": "Muy buena", "date": {"$date": "2024-11-04T13:00:29Z"}},
    {"name": "Guada", "email": "guada@gmail.com", "text": "Masoo", "date": {"$date": "2024-11-04T13:00:29Z"}},
]);

db.getCollection('comments').find({ name: "Jaz" })

db.getCollection('movies').find({}).limit(5);

//ej2: Listar el título, año, actores (cast), directores y rating 
// de las 10 películas con mayor rating (“imdb.rating”) de la década del 90. 
//¿Cuál es el valor del rating de la película que tiene mayor rating? 
// (Hint: Chequear que el valor de “imdb.rating” sea de tipo “double”).  

db.movies.aggregate([
    { 
      $match: { 
        year: { $gte: 1990, $lt: 2000 },
        "imdb.rating": { $exists: true, $ne: null, $type: "double" } // Verifica que imdb.rating existe y no es nulo
      }
    },
    // ordenar de mayor a menor
    { $sort: { "imdb.rating": -1 } },
    // para ordenar de menor a mayor cambiar -1 por 1
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        title: 1,
        year: 1,
        cast: 1,
        directors: 1,
        "imdb.rating": 1
      }
    }
]);

// con find

db.movies.find(
  { 
    year: { $gte: 1990, $lt: 2000 },
    "imdb.rating": { $exists: true, $ne: null, $type: "double" } // Verifica que imdb.rating existe y no es nulo
  },
  {
    _id: 0, // Excluir el campo _id
    title: 1, // Incluir el campo title
    year: 1, // Incluir el campo year
    cast: 1, // Incluir el campo cast
    directors: 1, // Incluir el campo directors
    "imdb.rating": 1 // Incluir el campo imdb.rating
  }
).sort({ "imdb.rating": -1 }) // Ordenar de mayor a menor por imdb.rating
.limit(10); // Limitar los resultados a 10


//ej3: Listar el nombre, email, texto y fecha de los comentarios 
// que la película con id (movie_id) ObjectId("573a1399f29313caabcee886") 
// recibió entre los años 2014 y 2016 inclusive. 
// Listar ordenados por fecha.

// Usa find() cuando solo necesitas filtrar, seleccionar campos y ordenar de forma simple.

db.comments.find(
    {
      movie_id: ObjectId("573a1399f29313caabcee886"), // Filtro por el ID de la película
      date: {
        $gte: ISODate("2014-01-01T00:00:00Z"), // Fecha desde el inicio de 2014
        $lte: ISODate("2016-12-31T23:59:59Z")  // Fecha hasta el final de 2016
      }
    },
    {
      _id: 0,          // Excluir el campo _id
      name: 1,         // Incluir el campo name
      email: 1,        // Incluir el campo email
      text: 1,         // Incluir el campo text
      date: 1          // Incluir el campo date
    }
).sort({ date: 1 }); // Ordenar por fecha de manera ascendente
  
//ej 3b: modificar la consulta anterior para responder ¿Cuántos comentarios recibió?

db.comments.aggregate([
  {
    $match: {
      movie_id: ObjectId("573a1399f29313caabcee886"), // Filtro por el ID de la película
      date: {
        $gte: ISODate("2014-01-01T00:00:00Z"), // Fecha desde el inicio de 2014
        $lte: ISODate("2016-12-31T23:59:59Z")  // Fecha hasta el final de 2016
      }
    }
  },
  {
    $count: "total_comments" // Devuelve el conteo en el campo "total_comments"
  }
]);

// otra opción

db.comments.countDocuments({
  movie_id: ObjectId("573a1399f29313caabcee886"), // Filtro por el ID de la película
  date: {
    $gte: ISODate("2014-01-01T00:00:00Z"), // Fecha desde el inicio de 2014
    $lte: ISODate("2016-12-31T23:59:59Z")  // Fecha hasta el final de 2016
  }
});

//ej4: Listar el nombre, id de la película, texto y fecha de los 3 
// comentarios más recientes realizados por el usuario con email patricia_good@fakegmail.com. 

db.comments.find(
  {
    email: "patricia_good@fakegmail.com"

  },
  {
    _id: 0,          // Excluir el campo _id
    name: 1,         // Incluir el campo name
    movie_id: 1,     // Incluir el campo movie_id
    text: 1,         // Incluir el campo text
    date: 1          // Incluir el campo date
  }
).sort({ date: -1 }).limit(3);

//ej5: Listar el título, idiomas (languages), géneros, fecha de lanzamiento (released) y número de votos (“imdb.votes”) 
// de las películas de géneros Drama y Action (la película puede tener otros géneros adicionales), 
// que solo están disponibles en un único idioma y por último tengan un rating (“imdb.rating”) mayor a 9 
// o bien tengan una duración (runtime) de al menos 180 minutos. 
// Listar ordenados por fecha de lanzamiento y número de votos.

// con find

db.movies.find(
  {
    // Filtrar por géneros que incluyan Drama y Action (pueden tener otros géneros adicionales)
    genres: { $all: ["Drama", "Action"] },

    // Filtrar por películas que estén disponibles en un único idioma
    languages: { $size: 1 },

    // Condición de rating mayor a 9 o duración de al menos 180 minutos
    $or: [
      { "imdb.rating": { $gt: 9 } },
      { runtime: { $gte: 180 } }
    ]
  },
  {
    // Proyección para incluir solo los campos necesarios
    _id: 0,           // Excluye el campo _id
    title: 1,         // Incluye el campo title
    languages: 1,     // Incluye el campo languages
    genres: 1,        // Incluye el campo genres
    released: 1,      // Incluye el campo released
    "imdb.votes": 1   // Incluye el número de votos en imdb
  }
).sort({ released: 1, "imdb.votes": -1 }); // Ordenar por fecha de lanzamiento ascendente y número de votos descendente

// con agregate

db.movies.aggregate([
  // Filtro inicial para seleccionar solo las películas que cumplen los criterios
  {
    $match: {
      genres: { $all: ["Drama", "Action"] }, // Géneros que incluyan Drama y Action
      languages: { $size: 1 },                // Disponible en un solo idioma
      $or: [
        { "imdb.rating": { $gt: 9 } },        // Rating mayor a 9
        { runtime: { $gte: 180 } }            // Duración de al menos 180 minutos
      ]
    }
  },
  // Proyección para solo los campos requeridos
  {
    $project: {
      _id: 0,             // Excluir _id
      title: 1,           // Incluir título
      languages: 1,       // Incluir idiomas
      genres: 1,          // Incluir géneros
      released: 1,        // Incluir fecha de lanzamiento
      "imdb.votes": 1     // Incluir número de votos
    }
  },
  // Ordenamiento por fecha de lanzamiento y número de votos
  {
    $sort: {
      released: 1,        // Orden ascendente por fecha de lanzamiento
      "imdb.votes": -1    // Orden descendente por número de votos
    }
  }
]);

//ej6: Listar el id del teatro (theaterId), estado (“location.address.state”), ciudad (“location.address.city”), 
// y coordenadas (“location.geo.coordinates”) de los teatros que se encuentran en algunos de los estados "CA", "NY", "TX" 
// y el nombre de la ciudades comienza con una ‘F’. 
//Listar ordenados por estado y ciudad.

// con find

db.theaters.find(
  {
    // Filtrar por los estados especificados
    "location.address.state": { $in: ["CA", "NY", "TX"] },
    
    // Filtrar por ciudades que comienzan con 'F' usando una expresión regular
    "location.address.city": { $regex: /^F/, $options: "i" }
  },
  {
    // Seleccionar solo los campos que queremos incluir en la respuesta
    _id: 0,                          // Excluir _id
    theaterId: 1,                     // Incluir theaterId
    "location.address.state": 1,      // Incluir estado
    "location.address.city": 1,       // Incluir ciudad
    "location.geo.coordinates": 1     // Incluir coordenadas
  }
).sort({
  "location.address.state": 1,        // Orden ascendente por estado
  "location.address.city": 1          // Orden ascendente por ciudad
});

// con agregate

db.theaters.aggregate([
  {
    // Filtro inicial para los estados y ciudades que comienzan con 'F'
    $match: {
      "location.address.state": { $in: ["CA", "NY", "TX"] },
      "location.address.city": { $regex: /^F/, $options: "i" }
    }
  },
  {
    // Proyección para incluir solo los campos deseados
    $project: {
      _id: 0,                          // Excluir _id
      theaterId: 1,                     // Incluir theaterId
      "location.address.state": 1,      // Incluir estado
      "location.address.city": 1,       // Incluir ciudad
      "location.geo.coordinates": 1     // Incluir coordenadas
    }
  },
  {
    // Ordenar los resultados por estado y luego por ciudad
    $sort: {
      "location.address.state": 1,      // Orden ascendente por estado
      "location.address.city": 1        // Orden ascendente por ciudad
    }
  }
]);

//ej7: Actualizar los valores de los campos texto (text) y fecha (date) 
// del comentario cuyo id es ObjectId("5b72236520a3277c015b3b73") 
// a "mi mejor comentario" y fecha actual respectivamente.

db.comments.updateOne(
  {
    _id: ObjectId("5b72236520a3277c015b3b73")  // Filtro para encontrar el documento por su _id
  },
  {
    $set: {
      text: "mi mejor comentario",              // Actualizar el campo text al nuevo valor
      date: new Date()                          // Actualizar el campo date a la fecha actual
    }
  }
);

// para chequear

db.comments.find(
  { _id: ObjectId("5b72236520a3277c015b3b73") },
  {
    _id: 1,          // Incluir el campo _id
    text: 1,         // Incluir el campo text
    date: 1          // Incluir el campo date
  }
);

// ejemplo para modificar varios comentarios que cumplen una condición

db.comments.updateMany(
  { date: { $lt: ISODate("2022-01-01T00:00:00Z") } },
  {
    $set: {
      text: "comentario actualizado",  
      date: new Date()                 
    }
  }
);

//ej8: Actualizar el valor de la contraseña del usuario cuyo email es joel.macdonel@fakegmail.com a "some password". 
// La misma consulta debe poder insertar un nuevo usuario en caso que el usuario no exista. 
// Ejecute la consulta dos veces. ¿Qué operación se realiza en cada caso?  (Hint: usar upserts).

db.users.updateOne(
  { email: "joel.macdonel@fakegmail.com" }, // Filtro para encontrar al usuario por email
  {
    $set: {
      password: "some password"            // Actualiza el campo password con el nuevo valor
    },
    $setOnInsert: {                        // Solo en caso de inserción, agrega estos valores
      name: "Joel MacDonel",               // Nombre solo en caso de que el usuario no exista
      email: "joel.macdonel@fakegmail.com" // Email en caso de inserción
    }
  },
  { upsert: true } // Permite insertar si el documento no existe
);

//ej9: Remover todos los comentarios realizados por el usuario 
// cuyo email es victor_patel@fakegmail.com durante el año 1980.

db.comments.deleteMany(
  {
    email: "victor_patel@fakegmail.com", // Filtrar por el email del usuario
    date: {
      $gte: ISODate("1980-01-01T00:00:00Z"), // Fecha desde el inicio de 1980
      $lt: ISODate("1981-01-01T00:00:00Z")   // Fecha hasta el inicio de 1981
    }
  }
);

// eliminar los últimos 5 comentarios que realizó

// Paso 1: Buscar los últimos 5 comentarios
const commentsToDelete = db.comments.find(
  { email: "victor_patel@fakegmail.com" } // Filtrar por el email del usuario
)
.sort({ date: -1 }) // Ordenar por fecha en orden descendente
.limit(5)           // Limitar a los últimos 5 comentarios
.toArray();        // Convertir el cursor a un array

// Paso 2: Eliminar los comentarios encontrados
if (commentsToDelete.length > 0) {
  db.comments.deleteMany(
    {
      _id: { $in: commentsToDelete.map(comment => comment._id) } // Eliminar por _id
    }
  );
}

// eliminar el último que realizó

// Buscar el último comentario
const lastComment = db.comments.findOne(
  { email: "victor_patel@fakegmail.com" } // Filtrar por el email del usuario
).sort({ date: -1 }); // Ordenar por fecha en orden descendente

// Eliminar el último comentario
if (lastComment) {
  db.comments.deleteOne(
    { _id: lastComment._id } // Eliminar por _id
  );
}

// eliminar un comentario cualquiera que realizó

// Buscar un comentario cualquiera
const randomComment = db.comments.findOne(
  { email: "victor_patel@fakegmail.com" } // Filtrar por el email del usuario
);

// Eliminar el comentario encontrado
if (randomComment) {
  db.comments.deleteOne(
    { _id: randomComment._id } // Eliminar por _id
  );
}

// eliminar un comentario específico por su _id

db.comments.deleteOne(
  { _id: ObjectId("5a9427648b0beebeb69579cc") } // El criterio de búsqueda
);

// -----------------------------------------------------------------------------------------------------------------------------

// ej1p2: Cantidad de cines (theaters) por estado.

db.theaters.aggregate([
  {
    $group: {
      _id: "$location.address.state", // Agrupar por estado
      count: { $sum: 1 } // Contar cada cine
    }
  },
  {
    $project: {
      _id: 0, // No mostrar el _id
      state: "$_id", // Renombrar _id a state
      count: 1 // Incluir el count en el resultado
    }
  }
]);

// la cantidad de cines de tal estado

db.theaters.find({ "location.address.state": "CA" }).count();

// el estado con más cines

db.theaters.aggregate([
  {
    $group: {
      _id: "$location.address.state", // Agrupar por estado
      count: { $sum: 1 } // Contar cada cine
    }
  },
  {
    $project: {
      _id: 0, // No mostrar el _id
      state: "$_id", // Renombrar _id a state
      count: 1 // Incluir el count en el resultado
    }
  },
  {
    $sort: { count: -1 } // Ordenar por count en orden descendente
  },
  {
    $limit: 1 // Limitar a un solo resultado (el estado con más cines)
  }
]);

//ej2p2: Cantidad de estados con al menos dos cines (theaters) registrados.

db.theaters.aggregate([
  {
    $group: {
      _id: "$location.address.state", // Agrupar por estado
      count: { $sum: 1 } // Contar cada cine
    }
  },
  {
    $match: {
      count: { $gte: 2 } // Filtrar estados con al menos 2 cines
    }
  },
  {
    $count: "numStates" // Contar cuántos estados cumplen la condición
  }
]);

// devolver también el nombre de los estados

db.theaters.aggregate([
  {
    $group: {
      _id: "$location.address.state", // Agrupar por estado
      count: { $sum: 1 } // Contar cada cine
    }
  },
  {
    $match: {
      count: { $gte: 2 } // Filtrar estados con al menos 2 cines
    }
  },
  {
    $project: {
      _id: 0, // No mostrar el _id
      state: "$_id", // Renombrar _id a state
      count: 1 // Incluir el count en el resultado
    }
  },
  {
    $group: {
      _id: null, // Agrupamos todo en un solo documento
      states: { $push: "$state" }, // Crear un array de estados
      numStates: { $sum: 1 } // Contar cuántos estados hay
    }
  }
]);

//ej3p2: Cantidad de películas dirigidas por "Louis Lumière"

// con agregacion

db.movies.aggregate([
  {
    $match: {
      directors: "Louis Lumière" // Filtrar las películas dirigidas por Louis Lumière
    }
  },
  {
    $count: "total_movies" // Contar el número total de películas
  }
]);

// con find (si le saco el count me devuelve cuáles son)

db.movies.find({ directors: "Louis Lumière" }).count();

//ej4p2: Cantidad de películas estrenadas en los años 50 (desde 1950 hasta 1959)

// con agregacion

db.movies.aggregate([
  {
    $match: {
      year: { $gte: 1950, $lt: 1960 } // Filtrar por el rango de años
    }
  },
  {
    $count: "total_movies" // Contar el número total de películas
  }
]);

// con find

db.movies.find({ year: { $gte: 1950, $lt: 1960 } }).count();

//ej5p2: Listar los 10 géneros con mayor cantidad de películas (tener en cuenta que las películas pueden tener más de un género). 
// Devolver el género y la cantidad de películas. Hint: unwind puede ser de utilidad

db.movies.aggregate([
  // Descomponer el array de géneros en documentos individuales
  {
    $unwind: "$genres" // Descompone el array de géneros
  },
  // Agrupar por género y contar las películas
  {
    $group: {
      _id: "$genres", // Agrupar por género
      count: { $sum: 1 } // Contar cada película
    }
  },
  // Ordenar por cantidad de películas de forma descendente
  {
    $sort: {
      count: -1 // Ordenar de mayor a menor
    }
  },
  // Limitar los resultados a los 10 géneros más comunes
  {
    $limit: 10
  },
  // Proyectar el resultado final
  {
    $project: {
      _id: 0, // No mostrar el _id
      genre: "$_id", // Renombrar _id a genre
      count: 1 // Incluir el count en el resultado
    }
  }
]);

//ej6p2: Top 10 de usuarios con mayor cantidad de comentarios,
// mostrando Nombre, Email y Cantidad de Comentarios.

db.comments.aggregate([
  // Agrupar por el nombre y el correo electrónico del usuario
  {
    $group: {
      _id: {
        name: "$name",   // Agrupar por nombre
        email: "$email"  // Agrupar por correo electrónico
      },
      count: { $sum: 1 } // Contar la cantidad de comentarios
    }
  },
  // Ordenar por la cantidad de comentarios de forma descendente
  {
    $sort: {
      count: -1 // Ordenar de mayor a menor
    }
  },
  // Limitar los resultados a los 10 usuarios con más comentarios
  {
    $limit: 10
  },
  // Proyectar el resultado final
  {
    $project: {
      _id: 0, // No mostrar el _id
      name: "$_id.name", // Renombrar _id.name a name
      email: "$_id.email", // Renombrar _id.email a email
      count: 1 // Incluir el count en el resultado
    }
  }
]);

//ej7p2: Ratings de IMDB promedio, mínimo y máximo por año de las películas estrenadas 
// en los años 80 (desde 1980 hasta 1989), ordenados de mayor a menor por promedio del año.

db.movies.aggregate([
  // Filtro para seleccionar solo las películas estrenadas entre 1980 y 1989
  {
    $match: {
      year: { $gte: 1980, $lte: 1989 }
    }
  },
  // Agrupar por año y calcular el promedio, mínimo y máximo del rating de IMDb
  {
    $group: {
      _id: "$year", // Agrupar por el campo 'year'
      averageRating: { $avg: "$imdb.rating" }, // Calcular el promedio
      minRating: { $min: "$imdb.rating" }, // Calcular el mínimo
      maxRating: { $max: "$imdb.rating" } // Calcular el máximo
    }
  },
  // Ordenar los resultados por el promedio del rating de IMDb de forma descendente
  {
    $sort: {
      averageRating: -1 // Ordenar de mayor a menor
    }
  },
  // Proyectar el resultado final
  {
    $project: {
      _id: 0, // No mostrar el _id
      year: "$_id", // Renombrar _id a year
      averageRating: 1, // Incluir el averageRating en el resultado
      minRating: 1, // Incluir el minRating en el resultado
      maxRating: 1  // Incluir el maxRating en el resultado
    }
  }
]);

//ej8p2: Título, año y cantidad de comentarios de las 10 películas con más comentarios.

db.movies.aggregate([
  {
    $project: {
      title: 1, // Incluir el título
      year: 1,  // Incluir el año
      num_comments: "$num_mflix_comments" // Incluir la cantidad de comentarios
    }
  },
  {
    $sort: {
      num_comments: -1 // Ordenar por cantidad de comentarios de mayor a menor
    }
  },
  {
    $limit: 10 // Limitar el resultado a las 10 primeras películas
  }
]);

// si quisiera hacerlo teniendo en cuenta los comentarios de la colección comments

db.comments.aggregate([
  {
    $group: {
      _id: "$movie_id", // Agrupar por el ID de la película
      count: { $sum: 1 } // Contar la cantidad de comentarios por película
    }
  },
  {
    $lookup: {
      from: "movies", // Colección de películas
      localField: "_id", // Campo del grupo (movie_id)
      foreignField: "_id", // Campo de la colección de películas que se usa para la coincidencia
      as: "movie" // Nombre del campo donde se almacenará el resultado de la coincidencia
    }
  },
  {
    $unwind: "$movie" // Descomponer el array de películas para acceder a sus campos
  },
  {
    $project: {
      title: "$movie.title", // Obtener el título de la película
      year: "$movie.year", // Obtener el año de la película
      num_comments: "$count" // Incluir la cantidad de comentarios
    }
  },
  {
    $sort: {
      num_comments: -1 // Ordenar por la cantidad de comentarios de mayor a menor
    }
  },
  {
    $limit: 10 // Limitar a las 10 películas con más comentarios
  }
]);

//ej9p2: Crear una vista con los 5 géneros con mayor cantidad de comentarios,
// junto con la cantidad de comentarios.

db.createView("top_genres_comments", "movies", [
  {
    $unwind: "$genres" // Descomponer los géneros
  },
  {
    $group: {
      _id: "$genres", // Agrupar por género
      total_comments: { $sum: "$num_mflix_comments" } // Sumar los comentarios
    }
  },
  {
    $sort: {
      total_comments: -1 // Ordenar de mayor a menor por total de comentarios
    }
  },
  {
    $limit: 5 // Limitar a los 5 géneros principales
  },
  {
    $project: {
      _id: 0, // No mostrar el _id
      genre: "$_id", // Renombrar _id a genre
      total_comments: 1 // Incluir total_comments en el resultado
    }
  }
]);

// ver la vista

db.top_genres_comments.find();

//ej10p2: Listar los actores (cast) que trabajaron en 2 o más películas dirigidas por "Jules Bass".
// Devolver el nombre de estos actores junto con la lista de películas (solo título y año) dirigidas por “Jules Bass” en las que trabajaron. 
// Hint1: addToSet
// Hint2: {'name.2': {$exists: true}} permite filtrar arrays con al menos 2 elementos, entender por qué.
// Hint3: Puede que tu solución no use Hint1 ni Hint2 e igualmente sea correcta

db.movies.aggregate([
  {
    $match: { directors: "Jules Bass" } // Filtrar películas dirigidas por Jules Bass
  },
  {
    $unwind: "$cast" // Descomponer el array de actores
  },
  {
    $group: {
      _id: "$cast", // Agrupar por nombre del actor
      movies: { $push: { title: "$title", year: "$year" } }, // Usar push para obtener todas las películas
      count: { $sum: 1 } // Contar cuántas películas tiene cada actor
    }
  },
  {
    $match: { count: { $gte: 2 } } // Filtrar actores que trabajaron en 2 o más películas
  },
  {
    $project: {
      _id: 0, // No mostrar el _id
      actor: "$_id", // Renombrar _id a actor
      movies: 1, // Incluir la lista de películas
      moviesCount: { $size: "$movies" } // Incluir un campo que indique cuántas películas hay
    }
  },
  {
    $match: { moviesCount: { $gte: 2 } } // Asegurarse de que haya al menos 2 películas
  }
]);

//ej11p2: Listar los usuarios que realizaron comentarios durante el mismo mes de lanzamiento de la película comentada,
// mostrando Nombre, Email, fecha del comentario, título de la película, fecha de lanzamiento.
// HINT: usar $lookup con multiple condiciones 

// para combinar los datos de colecciones se usa $lookup

db.comments.aggregate([
  {
    $lookup: {
      from: "movies", // Nombre de la colección de películas
      localField: "movie_id", // Campo de referencia en comments
      foreignField: "_id", // Campo de referencia en movies
      as: "movie_details" // Nombre del array que se añadirá
    }
  },
  {
    $unwind: "$movie_details" // Descomponer el array de detalles de la película
  },
  {
    $project: {
      name: 1, // Incluir nombre del usuario
      email: 1, // Incluir email del usuario
      date: 1, // Incluir fecha del comentario
      title: "$movie_details.title", // Incluir título de la película
      released: "$movie_details.released" // Incluir fecha de lanzamiento
    }
  },
  {
    $match: {
      $expr: {
        $eq: [
          { $month: "$date" }, // Mes del comentario
          { $month: "$released" } // Mes de lanzamiento de la película
        ]
      }
    }
  },
  {
    $match: {
      $expr: {
        $eq: [
          { $year: "$date" }, // Año del comentario
          { $year: "$released" } // Año de lanzamiento de la película
        ]
      }
    }
  }
]);

// -----------------------------------------------------------------------------------------------------------------------------

//ej1p3: Especificar en la colección users las siguientes reglas de validación:
// El campo name (requerido) debe ser un string con un máximo de 30 caracteres,
// email (requerido) debe ser un string que matchee con la expresión regular: "^(.*)@(.*)\\.(.{2,4})$" ,
// password (requerido) debe ser un string con al menos 50 caracteres.

// uso runCommand porque es una colexión ya existente
db.runCommand({
  // indico cuál es la colección
  collMod: "users",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "password"], // si algo es opcional no lo pongo aca
      properties: {
        name: {
          bsonType: "string",
          description: "El campo name es requerido y debe ser un string con un máximo de 30 caracteres.",
          maxLength: 30
        },
        email: {
          bsonType: "string",
          description: "El campo email es requerido y debe ser un string que cumpla con el formato de email.",
          pattern: "^(.*)@(.*)\\.(.{2,4})$"
        },
        password: {
          bsonType: "string",
          description: "El campo password es requerido y debe ser un string con al menos 50 caracteres.",
          minLength: 50
        }
      }
    }
  }
});

// insertar un usuario

db.users.insertOne({
  name: "Jazzzz",
  email: "jazjaz@gmail.com",
  password: "soloquieroaprobartodaslasmateriasdelafacuuuuuuuuuuuuuuuuuuuuu"
});

// crear una colección
db.createCollection("orders");

// crear una colección con validación
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "password"], // Aquí puedes ajustar los campos requeridos
      properties: {
        name: {
          bsonType: "string",
          description: "El campo name es requerido y debe ser un string con un máximo de 30 caracteres.",
          maxLength: 30
        },
        email: {
          bsonType: "string",
          description: "El campo email es opcional pero debe ser un string que cumpla con el formato de email.",
          pattern: "^(.*)@(.*)\\.(.{2,4})$"
        },
        password: {
          bsonType: "string",
          description: "El campo password es requerido y debe ser un string con al menos 50 caracteres.",
          minLength: 50
        }
      }
    }
  }
});

// utilizar $xpr para validar que el valor de un campo calculado sea correcto en función de otros dos campos

db.createCollection("orders", {
  validator: {
    $expr: {
      $eq: [
        "$totalWithIVA",
        { $multiply: ["$total", "$IVA"] }
      ]
    }
  }
});

//ej2p3: Obtener metadata de la colección users que garantice que las reglas de validación fueron correctamente aplicadas.

db.getCollectionInfos({ name: "users" });

//ej3p3: Especificar en la colección theaters las siguientes reglas de validación: 
// El campo theaterId (requerido) debe ser un int y location (requerido) debe ser un object con:
//un campo address (requerido) que sea un object con campos street1, city, state y zipcode todos de tipo string y requeridos
// un campo geo (no requerido) que sea un object con un campo type, con valores posibles “Point” o null y coordinates que debe ser una lista de 2 doubles
// estas reglas de validación no deben prohibir la inserción o actualización de documentos que no las cumplan sino que solamente deben advertir.

db.runCommand({
  // indico cuál es la colección
  collMod: "theaters",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["theaterId", "location"],
      properties: {
        theaterId: {
          bsonType: "int",
          description: "must be an integer and is required"
        },
        location: {
          bsonType: "object",
          required: ["address"],
          properties: {
            address: {
              bsonType: "object",
              required: ["street1", "city", "state", "zipcode"],
              properties: {
                street1: { bsonType: "string", description: "must be a string and is required" },
                city: { bsonType: "string", description: "must be a string and is required" },
                state: { bsonType: "string", description: "must be a string and is required" },
                zipcode: { bsonType: "string", description: "must be a string and is required" }
              }
            },
            geo: {
              bsonType: "object",
              properties: {
                type: { 
                  enum: ["Point", null], 
                  description: "can only be 'Point' or null"
                },
                coordinates: {
                  bsonType: "array",
                  items: [
                    { bsonType: "double" },
                    { bsonType: "double" }
                  ],
                  minItems: 2,
                  maxItems: 2,
                  description: "must be an array of two doubles"
                }
              }
            }
          }
        }
      }
    }
  },
  validationAction: "warn"
});

//ej4p3: Especificar en la colección movies las siguientes reglas de validación: 
// El campo title (requerido) es de tipo string, year (requerido) int con mínimo en 1900 y máximo en 3000,
// y que tanto cast, directors, countries, como genres sean arrays de strings sin duplicados.
// Hint: Usar el constructor NumberInt() para especificar valores enteros a la hora de insertar documentos. 
//Recordar que mongo shell es un intérprete javascript y en javascript los literales numéricos son de tipo Number (double).

db.runCommand({
  // indico cuál es la colección
  collMod: "movies",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "year"],
      properties: {
        title: {
          bsonType: "string",
          description: "must be a string and is required"
        },
        year: {
          bsonType: "int",
          minimum: 1900,
          maximum: 3000,
          description: "must be an integer between 1900 and 3000 and is required"
        },
        cast: {
          bsonType: "array",
          items: { bsonType: "string" },
          uniqueItems: true,
          description: "must be an array of strings with unique values"
        },
        directors: {
          bsonType: "array",
          items: { bsonType: "string" },
          uniqueItems: true,
          description: "must be an array of strings with unique values"
        },
        countries: {
          bsonType: "array",
          items: { bsonType: "string" },
          uniqueItems: true,
          description: "must be an array of strings with unique values"
        },
        genres: {
          bsonType: "array",
          items: { bsonType: "string" },
          uniqueItems: true,
          description: "must be an array of strings with unique values"
        }
      }
    }
  }
});

//ej5p3: Crear una colección userProfiles con las siguientes reglas de validación:
// Tenga un campo user_id (requerido) de tipo “objectId”,
// un campo language (requerido) con alguno de los siguientes valores [ “English”, “Spanish”, “Portuguese” ]
// y un campo favorite_genres (no requerido) que sea un array de strings sin duplicados.

db.createCollection("userProfiles", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "language"], // Aquí puedes ajustar los campos requeridos
      properties: {
        user_id: {
          bsonType: "objectId",
          description: "El campo user_id es requerido y debe ser de tipo objectId."
        },
        language: {
          bsonType: "string",
          enum: ["English", "Spanish", "Portuguese"],
          description: "El campo email es requerido y debe ser alguno de estos strings: English, Spanish, Portuguese."
        },
        favorite_genres: {
          bsonType: "array",
          items: { bsonType: "string" },
          uniqueItems: true,
          description: "El campo favorite_genres es opcional y debe ser un array de strings sin duplicados."
        }
      }
    }
  }
});

// ejemplo de inserción que cumpla con esas reglas:

db.userProfiles.insertOne({
  user_id: ObjectId("507f1f77bcf86cd799439011"),
  language: "Spanish",
  favorite_genres: ["Drama", "Comedy"]
});

// additionalProperties permite especificar si se aceptarán o no propiedades adicionales

db.createCollection("books", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "author", "publishedYear"],
      properties: {
        title: {
          bsonType: "string",
          description: "El título del libro es requerido y debe ser un string."
        },
        author: {
          bsonType: "string",
          description: "El autor del libro es requerido y debe ser un string."
        },
        publishedYear: {
          bsonType: "int",
          minimum: 1800,
          maximum: 3000,
          description: "El año de publicación es requerido, debe ser un entero entre 1800 y 3000."
        }
      },
      additionalProperties: false // No permite campos adicionales en los documentos
    }
  }
});

// modelado de datos

//ej6p3: Identificar los distintos tipos de relaciones (One-To-One, One-To-Many) en las colecciones movies y comments.
// Determinar si se usó documentos anidados o referencias en cada relación y justificar la razón. 

/*entre las colecciones movies y comments existe una relación One-To-Many (uno a muchos), 
ya que una película (movie) puede tener múltiples comentarios asociados (comments), 
pero cada comentario pertenece solo a una película.
En esta relación, se usaron referencias en lugar de documentos anidados. 
Esto se puede observar en el campo movie_id dentro de cada documento de la colección comments, 
que contiene el _id de una película en la colección movies (en formato ObjectId).*/