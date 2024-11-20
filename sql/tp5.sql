/*PRÁCTICO 5*/
use `sakila`;

drop table if exists `directors`;

/*1 Cree una tabla de `directors` con las columnas: Nombre, Apellido, Número de Películas.*/
create table `directors`(
	`Nombre` varchar(45) not null,
	`Apellido` varchar(45) not null,
	`NumeroDePeliculas` int
)

select * from directors;

/*debería agregarle id y clave primaria, y una relación tal vez*/

/*2 El top 5 de actrices y actores de la tabla `actors` que tienen la mayor experiencia 
(i.e. el mayor número de películas filmadas) son también directores de las películas en las que participaron. 
Basados en esta información, inserten, utilizando una subquery los valores correspondientes en la tabla `directors`.*/

insert into directors(Nombre, Apellido, NumeroDePeliculas)
select actor.first_name, actor.last_name,
		count(film_actor.film_id) as num_files
from actor 
inner join film_actor on actor.actor_id = film_actor.actor_id 
group by actor.actor_id 
order by num_files desc 
limit 5;

insert into directors(Nombre, Apellido, NumeroDePeliculas)
select actor.first_name, actor.last_name,
(select count(*) from film_actor where film_actor.actor_id = actor.actor_id) as num_files
from actor 
order by num_files desc 
limit 5;

/*3 Agregue una columna `premium_customer` que tendrá un valor 'T' o 'F' de acuerdo a si el cliente es "premium" o no. 
Por defecto ningún cliente será premium.*/
alter table customer add column premium_customer enum('T','F') not null default 'F';

/*4 Modifique la tabla customer. Marque con 'T' en la columna `premium_customer` 
de los 10 clientes con mayor dinero gastado en la plataforma.*/
update customer set customer.premium_customer = 'T'
where customer.customer_id in (
	select premium.customer_id
	from (
		select payment.customer_id,	sum(payment.amount) as total_spent
		from payment 
		group by customer_id 
		order by toal_spent desc 
		limit 10
	) as premium
);

/*5 Listar, ordenados por cantidad de películas (de mayor a menor), los distintos ratings de las películas existentes 
(Hint: rating se refiere en este caso a la clasificación según edad: G, PG, R, etc).*/
select film.rating, count(film.rating) as num_pel_rat
from film
group by film.rating 
order by num_pel_rat desc;

/*6 ¿Cuáles fueron la primera y última fecha donde hubo pagos?*/
(select payment.payment_date as p
from payment
order by p desc
limit 1)
union
(select payment.payment_date as p
from payment
order by p asc
limit 1);

select min(payment.payment_date) as first_date, max(payment.payment_date) as last_date
from payment;

/*7 Calcule, por cada mes, el promedio de pagos (Hint: vea la manera de extraer el nombre del mes de una fecha).*/
select month(payment.payment_date) as month_n, avg(payment.amount) as avg_pay
from payment
group by month(payment.payment_date);

/*GROUP BY MONTH(payment_date) agrupa las filas de la tabla en función del número del mes que aparece en la columna payment_date
AVG(amount) calcula el promedio de los valores de la columna amount dentro de cada grupo.*/

/*8 Listar los 10 distritos que tuvieron mayor cantidad de alquileres (con la cantidad total de alquileres).*/
with rental_districts as (
	select rental.rental_id, customer.customer_id, address.district 
	from rental
	inner join customer on rental.customer_id = customer.customer_id 
	inner join address on address.address_id = customer.address_id 
)
select district, count(*) as total_rent
from rental_districts
group by district
order by total_rent desc 
limit 10;

/*WITH rental_districts AS (...) inicia una CTE (Common Table Expression) llamada rental_districts. 
Es como una vista temporal que se puede usar en la consulta principal.
FROM rental_districts indica que se está utilizando la CTE rental_districts como la fuente de datos para la consulta principal.
Es decir, la consulta usará los resultados de la CTE creada anteriormente.
GROUP BY district agrupa los resultados por la columna district. 
Esto significa que se consolidan todas las filas que tienen el mismo valor en la columna district, 
y el COUNT(*) calculará el total de alquileres para cada distrito.*/

with rental_districts as (
	select rental.rental_id, customer.customer_id, address.district 
	from rental
	inner join customer on rental.customer_id = customer.customer_id 
	inner join address on address.address_id = customer.address_id 
)
select * from rental_districts;
/*para ver qué devuelve*/

/*9 Modifique la table `inventory_id` agregando una columna `stock` que sea un número entero
y representa la cantidad de copias de una misma película que tiene determinada tienda. 
El número por defecto debería ser 5 copias.*/
alter table inventory add column stock int not null default 5;

/*10 Cree un trigger `update_stock` que, cada vez que se agregue un nuevo registro a la tabla rental, 
haga un update en la tabla `inventory` restando una copia al stock de la película rentada 
(Hint: revisar que el rental no tiene información directa sobre la tienda, sino sobre el cliente, 
que está asociado a una tienda en particular).*/
delimiter //
create trigger update_stock
after insert on rental
for each row
begin
	update inventory set stock = stock - 1
	where inventory.inventory_id = new.inventory_id;
end; //
delimiter ;

/*chequear que el trigger funciona*/
SELECT * FROM inventory;

SELECT * FROM rental;

INSERT INTO rental (rental_date, inventory_id, customer_id, return_date, staff_id) 
VALUES (NOW(), 1, 1, NOW() + INTERVAL 7 DAY, 1);

SELECT * FROM inventory WHERE inventory_id = 1;

/*11 Cree una tabla `fines` que tenga dos campos: `rental_id` y `amount`. 
El primero es una clave foránea a la tabla rental y el segundo es un valor numérico con dos decimales.*/
drop table if exists `fines`;

create table `fines`(
	`fines_id` int not null auto_increment,
	`rental_id` int not null,
	`amount` decimal(10,2) not null,
	primary key (`fines_id`),
	constraint `fk_rental` foreign key (`rental_id`) references `rental` (`rental_id`)
)

/*por más que no pida id y primary key es buena práctica agregarle*/

/*12 Cree un procedimiento `check_date_and_fine` que revise la tabla `rental` y cree un registro en la tabla `fines` 
por cada `rental` cuya devolución (return_date) haya tardado más de 3 días (comparación con rental_date). 
El valor de la multa será el número de días de retraso multiplicado por 1.5.*/

DROP PROCEDURE IF EXISTS check_date_and_fine;

delimiter //
create procedure if not exists check_date_and_fine()
begin
	insert into fines(rental_id, amount)
	select rental.rental_id, datediff(rental.return_date, rental.rental_date) * 1.5 as amount
	from rental
	where datediff(rental.return_date, rental.rental_date) > 3; 
end; //
delimiter ;

CALL check_date_and_fine();

/*13 Crear un rol `employee` que tenga acceso de inserción, eliminación y actualización a la tabla `rental`.*/
CREATE ROLE employee;
GRANT INSERT, DELETE, UPDATE ON rental TO employee;

/*14 Revocar el acceso de eliminación a `employee` y crear un rol `administrator` que tenga todos los privilegios sobre la BD `sakila`.*/
revoke delete on rental from employee;

CREATE ROLE administrator;
GRANT ALL PRIVILEGES ON sakila.* TO administrator;

/*ON sakila.* es un comodín que indica que se están otorgando privilegios sobre todas las tablas de la base de datos sakila.
Si se quisiera otorgar privilegios solo sobre una tabla específica, podría hacerse así: ON sakila.nombre_tabla*/

/*15 Crear dos roles de empleado. A uno asignarle los permisos de `employee` y al otro de `administrator`.*/
CREATE ROLE employee1;
CREATE ROLE employee2;
GRANT employee TO employee1;
GRANT administrator TO employee2;

/*ASIGNAR ROLES A USUARIOS
-- Asignar rol de empleado a un usuario
GRANT employee1 TO 'nombre_empleado'@'localhost';  -- Cambia 'nombre_empleado' por el nombre real del usuario
-- Asignar rol de administrador a otro usuario
GRANT employee2 TO 'nombre_administrador'@'localhost';  -- Cambia 'nombre_administrador' por el nombre real del usuario

ACTIVAR LOS ROLES
SET DEFAULT ROLE employee1 TO 'nombre_empleado'@'localhost';  -- Activar rol de empleado
SET DEFAULT ROLE employee2 TO 'nombre_administrador'@'localhost';  -- Activar rol de administrador
*/



/*Contexto en Transacciones de Base de Datos
Transacciones: Son secuencias de operaciones que se ejecutan como una unidad. 
Una transacción puede incluir múltiples operaciones, y puedes usar procedimientos almacenados y triggers 
para garantizar que estas operaciones se realicen correctamente.
Por ejemplo, al registrar una venta, puedes usar un procedimiento almacenado para asegurarte de que se verifique 
el stock disponible antes de realizar la venta, y luego usar un trigger para actualizar automáticamente el stock 
después de que la venta se haya completado.

*Los procedimientos almacenados encapsulan lógica compleja y se pueden reutilizar.
Los triggers responden automáticamente a eventos y son útiles para mantener la integridad de los datos.
Ambos pueden ser utilizados en el contexto de transacciones para garantizar que las operaciones 
se realicen correctamente y de manera eficiente.*/















