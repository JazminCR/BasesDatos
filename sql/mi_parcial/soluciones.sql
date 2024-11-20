/*1 */

WITH more_reviews_24 AS (
	SELECT reviews.property_id, reviews.created_at AS reviewCreated,
		properties.owner_id, properties.name, properties.description, properties.location, 
		properties.price_per_night, properties.max_guests, properties.created_at AS propertyCreated
	FROM reviews
	INNER JOIN properties ON reviews.property_id = properties.id 
)
SELECT property_id, owner_id, name, description, location, 
	price_per_night, max_guests, propertyCreated, COUNT(*) AS total_review
FROM more_reviews_24
WHERE YEAR(reviewCreated) = 2024
GROUP BY property_id
ORDER BY total_review DESC 
LIMIT 7;

/*2 
profe: la propiedad puede aparecer varias veces, no es necesario agrupar*/

SELECT properties.id AS propertyId, properties.name, properties.price_per_night, 
	bookings.id AS bookingId, bookings.check_in, bookings.check_out,
	DATEDIFF(bookings.check_out, bookings.check_in) AS count_nights,
	DATEDIFF(bookings.check_out, bookings.check_in) * properties.price_per_night AS total
FROM properties
JOIN bookings ON properties.id = bookings.property_id;

/*3 */

SELECT users.name, users.email, users.password, users.created_at, SUM(payments.amount) AS totalPay
FROM users
JOIN payments ON users.id = payments.user_id 
GROUP BY users.id 
ORDER BY totalPay DESC
LIMIT 10;

/*4 */

DROP TRIGGER IF EXISTS notify_host_after_booking;

DELIMITER //
CREATE TRIGGER notify_host_after_booking
AFTER INSERT ON bookings
FOR EACH ROW 
BEGIN 
    INSERT INTO messages(sender_id, receiver_id, property_id, content)
    VALUES(bookings.user_id, bookings.user_id, bookings.property_id, 'Nueva reserva');
END; //
DELIMITER ; 

/*5 
profe: no hace falta calcular total price

no tuve tiempo de calcular la disponibilidad*/

DROP PROCEDURE IF EXISTS add_new_booking;

DELIMITER //
CREATE PROCEDURE add_new_booking(
	IN property_ident int,
	IN user_ident int,
	IN in_date date,
	IN out_date date
)
BEGIN 
	INSERT INTO bookings(property_id, user_id, check_in, check_out, total_price)
	VALUES (property_ident, user_ident, in_date, out_date, 0);
	UPDATE property_availability SET available_from = out_date
	WHERE property_availability.property_id = bookings.property_id;
END; //
DELIMITER ;

/*6 */

CREATE ROLE `admin`;
GRANT CREATE ON airbnb_like_db.properties TO `admin`;
GRANT UPDATE (status) ON airbnb_like_db.property_availability TO `admin`;

/*7 no contradice la propiedad de durabilidad: "Una vez que una transacción se ha completado, sus efectos son 
permanentes" porque los cambios se guardan permanentemente luego de commit, 
es decir que si hacemos la transacción ahora todavía pueden realizarse modificaciones.
todavía se encuentra activa o parcialmente confirmado el resto de las cosas hechas en la BD*/  




