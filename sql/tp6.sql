/*1 Devuelva la oficina con mayor número de empleados.*/
SELECT officeCode, COUNT(employeeNumber) AS num_employees
FROM employees
GROUP BY officeCode
ORDER BY num_employees DESC
LIMIT 1;


/*2 ¿Cuál es el promedio de órdenes hechas por oficina?, 
¿Qué oficina vendió la mayor cantidad de productos?*/
SELECT orders.orderNumber 
FROM orders
JOIN customers ON customers.customerNumber = orders.customerNumber 
JOIN 


/*3 Devolver el valor promedio, máximo y mínimo de pagos que se hacen por mes.*/
SELECT 
    MONTH(paymentDate) AS month, 
    AVG(amount) AS average_payment, 
    MAX(amount) AS max_payment, 
    MIN(amount) AS min_payment
FROM payments
GROUP BY MONTH(paymentDate)
ORDER BY MONTH(paymentDate) ASC;


/*4 Crear un procedimiento "Update Credit" en donde se modifique el límite de crédito de un cliente 
con un valor pasado por parámetro.*/
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS UpdateCredit(
	IN customer_ident int , 
	IN new_limit decimal(10,2)
)
BEGIN 
	UPDATE customers
	SET creditLimit = new_limit
	WHERE customer_ident = customerNumber; 
END; //
DELIMITER ;

SELECT customerNumber, creditLimit FROM customers c;
CALL UpdateCredit(103, 50000.00);


/*5 Cree una vista "Premium Customers" que devuelva el top 10 de clientes que más dinero han gastado en
la plataforma. La vista deberá devolver el nombre del cliente, la ciudad y el total gastado
por ese cliente en la plataforma.*/

CREATE VIEW PremiumCustomers AS 
WITH customerTotals AS (
	SELECT customers.customerName, 
			customers.city, 
			SUM(payments.amount) AS totalSpent
	FROM customers
	INNER JOIN payments ON customers.customerNumber = payments.customerNumber 
	GROUP BY customers.customerName, customers.city 
)
SELECT customerName, city, totalSpent
FROM CustomerTotals
ORDER BY totalSpent DESC
LIMIT 10;

SELECT * FROM PremiumCustomers;


/*6 Cree una función "employee of the month" que tome un mes y un año y devuelve el empleado (nombre y apellido)
cuyos clientes hayan efectuado la mayor cantidad de órdenes en ese mes.*/
DELIMITER //
CREATE FUNCTION IF NOT EXISTS EmployeeOfTheMonth(month_in int, year_in int)
RETURNS varchar(110)
BEGIN 
	DECLARE employee_fullname varchar(110)
    SELECT CONCAT_WS( ' ', e.firstName, e.lastName) INTO employee_fullname
    FROM employees e
    JOIN customers c ON e.employeeNumber = c.salesRepEmployeeNumber
    JOIN orders o ON c.customerNumber = o.customerNumber
    WHERE MONTH(o.orderDate) = month_in 
      AND YEAR(o.orderDate) = year_in
    GROUP BY e.employeeNumber
    ORDER BY COUNT(o.orderNumber) DESC
    LIMIT 1;	
RETURN employee_fullname; 
END; //
DELIMITER ;

/*no funciona*/


/*7 Crear una nueva tabla "Product Refillment". Deberá tener una relación varios a uno con "products"
y los campos: `refillmentID`, `productCode`, `orderDate`, `quantity`.*/

CREATE TABLE `ProductRefillment` (
	`refillmentID` int NOT NULL AUTO_INCREMENT,
	`productCode` varchar(15) NOT NULL,
	`orderDate` date DEFAULT NULL,
	`quantity` int NOT NULL,
	PRIMARY KEY (`refillmentID`), 
	FOREIGN KEY (`productCode`) REFERENCES `products`(`productCode`)
)


/*8 Definir un trigger "Restock Product" que esté pendiente de los cambios efectuados en `orderdetails`
y cada vez que se agregue una nueva orden revise la cantidad de productos pedidos (`quantityOrdered`)
y compare con la cantidad en stock (`quantityInStock`) y si es menor a 10 genere un pedido 
en la tabla "Product Refillment" por 10 nuevos productos.*/

DELIMITER //
CREATE TRIGGER RestockProduct
AFTER INSERT ON orderdetails
FOR EACH ROW 
BEGIN 
    DECLARE current_stock INT;

    SELECT quantityInStock INTO current_stock
    FROM products
    WHERE productCode = NEW.productCode;

    IF current_stock < 10 THEN
        INSERT INTO ProductRefillment (productCode, orderDate, quantity)
        VALUES (NEW.productCode, CURDATE(), 10);
    END IF;
END; //
DELIMITER ; 

/*Explicación:
Trigger AFTER INSERT: El trigger se activa después de cada inserción en la tabla orderdetails.

Declaración current_stock: Se declara una variable para almacenar la cantidad actual en stock del producto
que se acaba de ordenar.

Consulta del stock actual: Utilizando una consulta SELECT, obtenemos el valor de quantityInStock 
desde la tabla products para el producto asociado al nuevo registro en orderdetails 
(accedido con NEW.productCode).

Condición IF: Verificamos si el stock actual (current_stock) es menor a 10.

Inserción en ProductRefillment: Si la condición se cumple, se inserta un nuevo registro 
en la tabla ProductRefillment con la fecha actual (CURDATE()) y 10 unidades de reabastecimiento.

Cuando el trigger se ejecuta, la palabra clave NEW representa la fila recién insertada o modificada en la tabla. 
En un trigger de inserción (AFTER INSERT), NEW se refiere a los valores de la nueva fila que acaba de ser añadida.

Por ejemplo, si se inserta esta fila en orderdetails:
INSERT INTO orderdetails (orderNumber, productCode, quantityOrdered, priceEach) 
VALUES (10100, 'S10_1678', 30, 95.70);
NEW.productCode sería 'S10_1678', porque es el valor del campo productCode de la nueva fila insertada.*/


/*9 Crear un rol "Empleado" en la BD que establezca accesos de lectura a todas las tablas 
y accesos de creación de vistas.*/

CREATE ROLE `Empleado`;

-- Permisos de lectura en todas las tablas de la base de datos
GRANT SELECT ON classicmodels.* TO `Empleado`;

-- Permisos para crear vistas
GRANT CREATE VIEW ON classicmodels.* TO `Empleado`;





