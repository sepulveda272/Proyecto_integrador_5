-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 01-06-2026 a las 01:56:57
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `db_cultivos_plagas`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `afectado`
--

CREATE TABLE `afectado` (
  `Id_afectado` int(11) NOT NULL,
  `Id_cultivo` int(11) NOT NULL,
  `Id_plaga` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `afectado`
--

INSERT INTO `afectado` (`Id_afectado`, `Id_cultivo`, `Id_plaga`) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 2, 3),
(4, 2, 4),
(5, 3, 5),
(6, 3, 2),
(7, 4, 6),
(8, 4, 7),
(9, 4, 2),
(10, 5, 8),
(11, 5, 7),
(12, 6, 4),
(13, 6, 7),
(14, 7, 4),
(15, 7, 2),
(17, 8, 9);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cultivo`
--

CREATE TABLE `cultivo` (
  `Id_cultivo` int(11) NOT NULL,
  `Nombre_especie` varchar(255) NOT NULL,
  `Variedad` varchar(255) NOT NULL,
  `Imagen` varchar(255) NOT NULL COMMENT 'Ruta o URL de la imagen',
  `Descripcion` text DEFAULT NULL COMMENT 'Descripción opcional (marcada con O)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `cultivo`
--

INSERT INTO `cultivo` (`Id_cultivo`, `Nombre_especie`, `Variedad`, `Imagen`, `Descripcion`) VALUES
(1, 'Café', 'Caturra', 'https://optimise2.assets-servd.host/worldcoffee-research/production/images/Arabica/Caturra-1.jpg?w=1920&q=82&auto=format&fit=min&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1684915609&s=e90f2f8bded63dbdbdde1e752c22c90d', 'Cultivo de exportación que requiere climas templados y sombra parcial.'),
(2, 'Papa', 'Pastusa Superior', 'https://la-canasta.org/wp-content/uploads/2025/06/PAPA-PASTUSA.png', 'Tubérculo de clima frío, base de la alimentación en zonas andinas.'),
(3, 'Cacao', 'CCN-51', 'https://stcroperproduction.blob.core.windows.net/uploads-public/images/3zdcyi801v2kn4qmopdwj/original.jpeg', 'Árbol tropical cuyos granos son fermentados para producir chocolate.'),
(4, 'Aguacate', 'Hass', 'https://cdn.shopify.com/s/files/1/0611/0252/2576/files/13_f871f98e-41a1-4793-9838-6053f931f33f.png?v=1716315288', 'Fruto de piel rugosa y alto contenido de grasas saludables.'),
(5, 'Limón', 'Tahití', 'https://upload.wikimedia.org/wikipedia/commons/6/68/Starr_061105-1380_Citrus_aurantiifolia.jpg', 'Cítrico sin semilla, muy resistente pero sensible a vectores'),
(6, 'Arroz', 'Fedearroz 67', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGfVS3BHDVpJglJRLzWSidEYHWiyGrcSXHkA&s', 'Gramínea que crece en suelos inundados o de alta humedad.'),
(7, 'Maíz', 'Híbrido Blanco', 'https://image.made-in-china.com/365f3j00mLSodlhPwBbV/Semillas-de-ma-z-h-brido-blanco-dulce-de-alta-calidad-F1-para-plantar.webp', 'Cereal versátil que se cultiva desde el nivel del mar hasta montañas.'),
(8, 'prueba  cultivo', 'prueba cultivo', '/uploads/cultivos/1780251373737-ldjmj1q2da.jpeg', 'prueba1');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `plagas`
--

CREATE TABLE `plagas` (
  `Id_plaga` int(11) NOT NULL COMMENT 'Clave primaria autoincremental',
  `Nombre_cientifico` varchar(255) NOT NULL,
  `Nombre_comun` varchar(255) NOT NULL,
  `Imagen` varchar(255) NOT NULL COMMENT 'Ruta o URL de la imagen',
  `Descripcion` text DEFAULT NULL COMMENT 'Descripción opcional (marcada con O)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `plagas`
--

INSERT INTO `plagas` (`Id_plaga`, `Nombre_cientifico`, `Nombre_comun`, `Imagen`, `Descripcion`) VALUES
(1, 'Hypothenemus hampei', 'Broca del Café', 'https://www.invesa.com/wp-content/uploads/2020/10/Broca2.jpg', 'Coleóptero que perfora el grano de café afectando la calidad.'),
(2, 'Atta cephalotes', 'Hormiga Arriera', 'https://d2yoo3qu6vrk5d.cloudfront.net/images/20220609180604/cropped-26faa1ae-6264-45c1-af25-01e5403b2547-3.jpg', 'Insecto defoliador que corta hojas para cultivar su hongo.'),
(3, 'Phytophthora infestans', 'Gota de la Papa', 'https://www.invesa.com/wp-content/uploads/2020/10/Gota1.jpg', 'Causa necrosis rápida en hojas y tubérculos de papa.'),
(4, 'Spodoptera frugiperda', 'Gusano Cogollero', 'https://a.storyblok.com/f/160385/399a90b247/gusano_cogollero_del_maiz_fao.jpg/m/?w=256&q=100', 'Larva que devora el cogollo de maíz, arroz y otros cereales.'),
(5, 'Moniliophthora roreri', 'Monilia del Cacao', 'https://progresacaribe.info/wp-content/uploads/2022/08/Monilia-1.jpeg', 'Hongo que pudre internamente las mazorcas de cacao.'),
(6, 'Stenoma catenifer', 'Pasador del Fruto', 'https://www.invesa.com/wp-content/uploads/2020/10/Pasador-del-fruto-aguacate.jpg', 'Polilla cuyas larvas dañan la semilla del aguacate.'),
(7, 'Thrips palmi', 'Trips', 'https://static.wixstatic.com/media/1b8a25_e4338fe94f9c4fe3bbe251a87974fb99~mv2.jpg', 'Insectos diminutos que succionan savia y deforman brotes.'),
(8, 'Diaphorina citri', 'Psílido de Cítricos', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRSZWx9j-pMerhAnIIcyFKZO9VlAKpDREwR_Q&s', 'Pequeño insecto vector de la enfermedad HLB.'),
(9, 'prueba plaga', 'prueba plaga', '/uploads/plagas/1780251411723-aeuxmpk1cus.jpeg', 'prueba');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `afectado`
--
ALTER TABLE `afectado`
  ADD PRIMARY KEY (`Id_afectado`),
  ADD KEY `fk_afectado_cultivo` (`Id_cultivo`),
  ADD KEY `fk_afectado_plaga` (`Id_plaga`);

--
-- Indices de la tabla `cultivo`
--
ALTER TABLE `cultivo`
  ADD PRIMARY KEY (`Id_cultivo`);

--
-- Indices de la tabla `plagas`
--
ALTER TABLE `plagas`
  ADD PRIMARY KEY (`Id_plaga`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `afectado`
--
ALTER TABLE `afectado`
  MODIFY `Id_afectado` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de la tabla `cultivo`
--
ALTER TABLE `cultivo`
  MODIFY `Id_cultivo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `plagas`
--
ALTER TABLE `plagas`
  MODIFY `Id_plaga` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Clave primaria autoincremental', AUTO_INCREMENT=10;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `afectado`
--
ALTER TABLE `afectado`
  ADD CONSTRAINT `fk_afectado_cultivo` FOREIGN KEY (`Id_cultivo`) REFERENCES `cultivo` (`Id_cultivo`),
  ADD CONSTRAINT `fk_afectado_plaga` FOREIGN KEY (`Id_plaga`) REFERENCES `plagas` (`Id_plaga`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
