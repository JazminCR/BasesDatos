// Modelado con Referencias de Documentos insertOne (Modelo Relacional)

db.student.insertOne( {
    "_id": "jmoore",
    "name": "James Moore"
} )

db.address.insertOne( {
    "_id": "a1", 
    "student_id": "jmoore",
    "street": "123 Sesame St", 
    "city": "Anytown", 
    "zip": "12345"
} )

db.address.insertOne( {
    "_id": "a2", 
    "student_id": "jmoore",
    "street": "321 Some Other Street", 
    "city": "Boston", 
    "zip": "45678"
} )

/*los documentos address contienen una referencia al documento student usando el campo student_id. 
Esta es una relación uno a muchos en la que cada dirección está asociada a un solo estudiante, 
pero un estudiante puede tener múltiples direcciones.
cuando usarlo? Cuando necesitas hacer consultas independientes sobre las direcciones 
sin cargar toda la información del estudiante.*/ 

// Modelado con documentos anidados

db.student.insertOne( {
    "_id": "jmoore",
    "name": "James Moore",
    "address" : [ 
        { "street": "123 Sesame St", "city": "Anytown", "zip": "12345" },
        { "street": "321 Some Other Street", "city": "Boston", "zip": "45678" }
    ]
} )

/*las direcciones están anidadas dentro del documento del estudiante como un array. 
Esto representa una relación uno a muchos pero dentro de un solo documento.
Se puede obtener toda la información de un estudiante y sus direcciones en una sola consulta.*/ 

// Modelado con Arreglo de Referencias

db.products.insertOne( { 
    "_id": "product1", 
    name: "left-handed smoke shifter", 
    manufacturer: "Acme Corp", 
    catalog_number: 1234, 
    parts: [ "part1", "partN"]
} )

db.parts.insertMany( [ 
    { "_id": "part1", partno: "123-aff-456", name: "#4 grommet", qty: 94, price: 3.99 },
    { "_id": "partN", partno: "123-aff-678", name: "#5 grommet", qty: 94, price: 3.29 }
] )

/*el campo parts es un arreglo de referencias que contiene los identificadores de las piezas asociadas al producto. 
Este modelo es útil cuando tienes una colección de elementos relacionados que pueden existir independientemente pero están asociados entre sí.
Se puede consultar las partes de un producto sin cargar todo el documento del producto.
Para obtener los detalles completos de las piezas, se necesita hacer consultas adicionales (similar al modelo con referencias de documentos).*/

// Modelado con Referencias de Documentos insertMany

db.hosts.insertOne( {
    _id : "host1",
    name : "goofy.example.com",
    ipaddr : "127.66.66.66"
} )

db.logmsg.insertMany( [	
    { _id: 1000001, time: ISODate("2014-03-28T09:42:41"), message: "cpu is on fire!", id_host: "host1" },
    { _id: 1000002, time: ISODate("2014-03-28T09:49:41"), message: "cpu is idle!", id_host: "host1" }
] )

/*as entradas de log (logmsg) están relacionadas con los hosts mediante el campo id_host, 
que es una referencia al documento host.
Se puede consultar y actualizar los logs sin afectar la información del host.
Se necesita hacer consultas adicionales para obtener los logs de un host.*/