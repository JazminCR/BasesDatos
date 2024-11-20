/* PRÁCTICO 2 */

use `world`;

drop table if exists `continent`;

create table `continent` (
	`name` varchar(20) not null,
	`area` int not null,
	`percent_total_mass` decimal(5,2) not null,
	`most_populous_city` varchar(50) not null,
	primary key (`name`)
)

insert into continent (name, area, percent_total_mass, most_populous_city) values
('Africa', 30370000, 20.4, 'Cairo, Egypt'),
('Antarctica', 14000000 , 9.2, 'McMurdo Station*'),
('Asia', 44579000, 29.5, 'Mumbai, India'),
('Europe', 10180000, 6.8, 'Instanbul, Turquia'),
('North America', 24709000, 16.5, 'Ciudad de México, Mexico'),
('Oceania', 8600000, 5.9, 'Sydney, Australia'),
('South America', 17840000, 12.0, 'São Paulo, Brazil');

select * from continent c ;

/*Modificar la tabla "country" de manera que el campo "Continent" pase a ser una clave externa (o foreign key) a la tabla Continent.*/
alter table country modify column `Continent` varchar(20);
alter table country add constraint `continent_fk` foreign key (Continent) references continent (name);

/* Devuelva una lista de los nombres y las regiones a las que pertenece cada país ordenada alfabéticamente*/
select Name, Region 
from country 
order by Name asc;

/*Liste el nombre y la población de las 10 ciudades más pobladas del mundo*/
select Name, Population 
from city 
order by Population desc 
limit 10;

/*Liste el nombre, región, superficie y forma de gobierno de los 10 países con menor superficie*/
select Name, Region, SurfaceArea, GovernmentForm
from country
order by SurfaceArea asc 
limit 10;

/*Liste todos los países que no tienen independencia (ver que define la independencia de un país en la BD)*/
select Name
from country
where IndepYear is null;

/*Liste el nombre y el porcentaje de hablantes que tienen todos los idiomas declarados oficiales*/
select language, Percentage
from countrylanguage
where IsOfficial = 'T';

/*Actualizar el valor de porcentaje del idioma inglés en el país con código 'AIA' a 100.0*/
update countrylanguage set Percentage = 100.0 where Language = 'English' and CountryCode = 'AIA';

/*Listar las ciudades que pertenecen a Córdoba (District) dentro de Argentina*/
select Name from city where District = 'C??rdoba' and CountryCode = 'ARG';

/*Eliminar todas las ciudades que pertenezcan a Córdoba fuera de Argentina*/
delete from city where District = 'C??rdoba' and CountryCode != 'ARG';

/*Listar los países cuyo Jefe de Estado se llame John*/
select Name from country where HeadOfState like '%John%';

/*Listar los países cuya población esté entre 35 M y 45 M ordenados por población de forma descendente*/
select Name, Population from country where Population between 35000000 and 45000000 order by Population desc;

/* PRÁCTICO 3 */

/*1 Lista el nombre de la ciudad, nombre del país, región y forma de gobierno de las 10 ciudades más pobladas del mundo*/
select city.Name as CityName, country.Name as CountryName, country.Region, country.GovernmentForm
from city
inner join country on city.CountryCode = country.Code
order by city.Population desc
limit 10;

/*2 Listar los 10 países con menor población del mundo, junto a sus ciudades capitales 
(Hint: puede que uno de estos países no tenga ciudad capital asignada, en este caso deberá mostrar "NULL")
COALESCE devuelve el valor que tiene, sino tiene devuelve NULL*/
select country.Name as CountryName,  COALESCE(city.Name, 'NULL') as CityCapitalName
from country
inner join city on city.ID = country.Capital 
order by country.Population asc 
limit 10;

/*3 Listar el nombre, continente y todos los lenguajes oficiales de cada país. 
(Hint: habrá más de una fila por país si tiene varios idiomas oficiales)*/
select country.Name as CountryName, country.Continent, countrylanguage.Language
from country
inner join countrylanguage on countrylanguage.CountryCode = country.Code 
where countrylanguage.IsOfficial = 'T';

/*4 Listar el nombre del país y nombre de capital, de los 20 países con mayor superficie del mundo*/
select country.Name as CountryName, city.Name as CityCapital
from country
inner join city on country.Capital = city.ID 
order by country.SurfaceArea desc 
limit 20;

/*5 Listar las ciudades junto a sus idiomas oficiales (ordenado por la población de la ciudad) y el porcentaje de hablantes del idioma*/
(select city.Name as CityName, countrylanguage.language, countrylanguage.Percentage 
from city
inner join countrylanguage on city.CountryCode = countrylanguage.CountryCode 
where countrylanguage.IsOfficial = 'T'
order by city.Population asc)
except
(select city.Name as CityName, countrylanguage.Language, countrylanguage.Percentage
from city
inner join country on city.CountryCode = country.Code
inner join countrylanguage ON country.Code = countrylanguage.CountryCode
where countrylanguage.IsOfficial = 'T'
order by city.Population asc);
/*uso except para ver la diferencia del resultado, segunda opción by chatgpt*/

/*6 Listar los 10 países con mayor población y los 10 países con menor población (que tengan al menos 100 habitantes)*/
(select country.Name as CountryName, country.Population 
from country
where country.Population >= 100
order by country.Population desc
limit 10)
union
(select country.Name as CountryName, country.Population 
from country
where country.Population >= 100
order by country.Population asc
limit 10);
/*cuando se usan de estos operadores las 2 consultas deben decir "lo mismo"*/
/*el where debe ir antes del order by*/

/*7 Listar aquellos países cuyos lenguajes oficiales son el Inglés y el Francés (hint: no debería haber filas duplicadas)*/
/*la forma correcta de hacerlo es la siguiente:*/
(select country.Name
from country
inner join countrylanguage on country.Code = countrylanguage.CountryCode
where countrylanguage.language = 'English' and countrylanguage.IsOfficial = 'T')
intersect
(select country.Name
from country
inner join countrylanguage on country.Code = countrylanguage.CountryCode
where countrylanguage.language = 'French' and countrylanguage.IsOfficial = 'T');

/*esta forma devuelve los paises que tienen inglés o frances, si un pais tiene los 2 lo devuelve 2 veces*/
select country.Name, countrylanguage.Language 
from country
inner join countrylanguage on country.Code = countrylanguage.CountryCode 
where (countrylanguage.Language = 'English' or countrylanguage.language = 'French') and countrylanguage.IsOfficial = 'T';

/*esta forma devuelve los paises que tienen inglés o frances, si un pais tiene los 2 lo devuelve 1 vez*/
/*es decir que agrupa los resultados por el nombre del país*/
select country.Name
from country
inner join countrylanguage on country.Code = countrylanguage.CountryCode
where countrylanguage.IsOfficial = 'T'
and (countrylanguage.Language = 'English' or countrylanguage.Language = 'French')
group by country.Name;

/*esta forma devuelve los paises que tienen inglés y frances*/
/*asegura que el país tiene ambos lenguajes*/
select country.Name
from country
inner join countrylanguage on country.Code = countrylanguage.CountryCode
where countrylanguage.IsOfficial = 'T'
and (countrylanguage.Language = 'English' or countrylanguage.Language = 'French')
group by country.Name
having count(distinct countrylanguage.Language) = 2;

/*¿por qué no puedo hacer esto?*/
select country.Name, countrylanguage.Language 
from country
inner join countrylanguage on country.Code = countrylanguage.CountryCode 
where countrylanguage.Language = 'English' and countrylanguage.language = 'French' and countrylanguage.IsOfficial = 'T';
/*porque un registro en la tabla countrylanguage no puede tener al mismo tiempo el valor 'English' y 'French' en la columna Language*/

/*8 Listar aquellos países que tengan hablantes del Inglés pero no del Español en su población*/
(select country.Name, countrylanguage.Language
from country
inner join countrylanguage on country.Code = countrylanguage.CountryCode 
where countrylanguage.language = 'English'
)
except
(select country.Name, countrylanguage.Language
from country
inner join countrylanguage on country.Code = countrylanguage.CountryCode 
where countrylanguage.language = 'Spanish');

/*9 ¿las siguientes consultas devuelven lo mismo?*/
SELECT city.Name, country.Name
FROM city
INNER JOIN country ON city.CountryCode = country.Code AND country.Name = 'Argentina';

SELECT city.Name, country.Name
FROM city
INNER JOIN country ON city.CountryCode = country.Code
WHERE country.Name = 'Argentina';

/*En una consulta INNER JOIN, la condición dentro de la cláusula ON 
 * y la condición dentro de la cláusula WHERE actúan de manera similar, 
 * filtrando las filas que cumplen ambas condiciones.*/

SELECT city.Name, country.Name
FROM city
LEFT JOIN country ON city.CountryCode = country.Code AND country.Name = 'Argentina';

/*LEFT JOIN asegura que todas las ciudades se incluyan, independientemente de si pertenecen a Argentina o no.
Si una ciudad no pertenece a Argentina, aún aparecerá en el resultado, pero el campo country.Name será NULL*/

SELECT city.Name, country.Name
FROM city
LEFT JOIN country ON city.CountryCode = country.Code
WHERE country.Name = 'Argentina';

/*WHERE country.Name = 'Argentina' filtra las filas después de hacer el LEFT JOIN, 
por lo que elimina cualquier ciudad cuyo país no sea Argentina*/

/*PRÁCTICO 4*/

/*1 Listar el nombre de la ciudad y el nombre del país de todas las ciudades 
que pertenezcan a países con una población menor a 10000 habitantes*/
select city.Name as CityName, country.Name as CountryName
from city
inner join country on city.CountryCode = country.Code 
where country.Population < 10000;


select city.Name as CityName, country.Name as CountryName, country.Population 
FROM city 
INNER join country on city.CountryCode = country.Code
where country.Code IN (
            SELECT Code
            FROM country
            WHERE Population < 10000);


/*2 Listar todas aquellas ciudades cuya población sea mayor que la población promedio entre todas las ciudades*/
select city.Name, city.Population 
from city
where city.Population > (
	select avg(city.Population)
	from city
);


SELECT c.Name, c.Population,
       (SELECT AVG(Population) FROM city) AS AvgPopulation
FROM city c
WHERE c.Population > (SELECT AVG(Population) FROM city);


/*3 Listar todas aquellas ciudades no asiáticas cuya población sea igual o mayor a la población total de algún país de Asia*/
select city.Name as CityName
from city
where city.CountryCode not in (
	select country.Code 
	from country
	where country.Continent != 'Asia'
)
and city.Population >= some (
	select country.Population
	from country
	where country.Continent = 'Asia'
);


select city.Name as Ciudad_no_Asiatica
from city
join country on city.CountryCode = country.Code 
where country.Continent != 'Asia' and
city.Population >= some (select Population from country where Continent = 'Asia');


/*4 Listar aquellos países junto a sus idiomas no oficiales, que superen en porcentaje de hablantes 
a cada uno de los idiomas oficiales del país*/
select country.Name, cl1.Language
from country
inner join countrylanguage cl1 on country.Code = cl1.CountryCode 
where cl1.IsOfficial = 'F'
and cl1.Percentage > all (
	select cl2.Percentage
	from countrylanguage cl2
	where cl2.CountryCode = country.Code 
	and cl2.IsOfficial = 'T'
);


/*5 Listar (sin duplicados) aquellas regiones que tengan países con una superficie menor a 1000 km2 
y exista (en el país) al menos una ciudad con más de 100000 habitantes. 
(Hint: Esto puede resolverse con o sin una subquery, intenten encontrar ambas respuestas)*/
select distinct country.Region 
from country
inner join city on city.CountryCode = country.Code 
where country.SurfaceArea < 1000 and city.Population > 100000;

select distinct country.Region 
from country
where country.SurfaceArea < 1000
and country.Code in (
	select city.CountryCode 
	from city
	where city.Population > 100000
);


/*6 Listar el nombre de cada país con la cantidad de habitantes de su ciudad más poblada. 
(Hint: Hay dos maneras de llegar al mismo resultado. Usando consultas escalares o usando agrupaciones, encontrar ambas)*/

select country.Name,
		(select max(city.Population) from city where city.CountryCode = country.Code) as habCityMasPob
from country;


select country.Name, max(city.Population) as habCityMasPob
from country
inner join city on country.Code = city.CountryCode 
group by country.Name;


/*7 Listar aquellos países y sus lenguajes no oficiales cuyo porcentaje de hablantes 
sea mayor al promedio de hablantes de los lenguajes oficiales*/

select country.Name, cl1.Language
from country
inner join countrylanguage cl1 on country.Code = cl1.CountryCode 
where cl1.IsOfficial = 'F'
and cl1.Percentage > all (
	select avg(cl2.Percentage)
	from countrylanguage cl2
	where cl2.CountryCode = country.Code 
	and cl2.IsOfficial = 'T'
);


/*8 Listar la cantidad de habitantes por continente ordenado en forma descendente*/
select country.Continent, sum(city.Population) as habContinent
from country
join city on city.CountryCode = country.Code 
group by country.Continent 
order by habContinent desc;


/*9 Listar el promedio de esperanza de vida (LifeExpectancy) por continente con una esperanza de vida entre 40 y 70 años*/
select country.Continent, avg(country.LifeExpectancy) as avgLifeExp
from country
where country.LifeExpectancy between 40 and 70
group by country.Continent;


/*10 Listar la cantidad máxima, mínima, promedio y suma de habitantes por continente*/
select
    max(habContinent) as MaxPopulation,
    min(habContinent) as MinPopulation,
    avg(habContinent) as AvgPopulation,
    sum(habContinent) as TotalPopulation
from (
    select country.Continent, sum(city.Population) as habContinent
    from country
    join city on city.CountryCode = country.Code 
    group by country.Continent
) as PopulationByContinent;


/*Si en la consulta 6 se quisiera devolver, además de las columnas ya solicitadas, el nombre de la ciudad más poblada. 
¿Podría lograrse con agrupaciones? ¿y con una subquery escalar?*/

/*6 Listar el nombre de cada país con la cantidad de habitantes de su ciudad más poblada. 
(Hint: Hay dos maneras de llegar al mismo resultado. Usando consultas escalares o usando agrupaciones, encontrar ambas)*/

select country.Name,
		(select max(city.Population) from city where city.CountryCode = country.Code) as habCityMasPob,
		(select city.Name from city where city.CountryCode = country.Code order by city.Population desc limit 1) as cityName
from country;

/*ORDER BY city.Population DESC LIMIT 1 es fundamental para asegurar que se está
seleccionando la ciudad más poblada de un país específico*/

/*con agrupaciones creo que no se puede*/



