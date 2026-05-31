-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 01-06-2026 a las 01:57:05
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
-- Base de datos: `db_ubicaciones`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `citas`
--

CREATE TABLE `citas` (
  `Id_cita` int(11) NOT NULL,
  `Hora_inspeccion` time DEFAULT NULL,
  `Fecha_inspeccion` date DEFAULT NULL,
  `Id_productor` int(11) NOT NULL,
  `Id_lugar` int(11) NOT NULL,
  `Id_tecnico` int(11) DEFAULT NULL COMMENT 'Referencia externa al microservicio de Inspecciones',
  `Estado` varchar(20) NOT NULL DEFAULT 'Pendiente',
  `Observaciones` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `citas`
--

INSERT INTO `citas` (`Id_cita`, `Hora_inspeccion`, `Fecha_inspeccion`, `Id_productor`, `Id_lugar`, `Id_tecnico`, `Estado`, `Observaciones`) VALUES
(5, '02:10:00', '2026-05-30', 1, 12, 1, 'Aceptada', 'El productor solicita revisión urgente en el lote principal por posible plaga.'),
(9, '01:48:00', '2026-06-06', 1, 2, 1, 'Aceptada', 'prueba'),
(10, '12:18:00', '2026-06-01', 1, 19, 1, 'Aceptada', 'Inspeccion en horas de la tarde'),
(12, '18:29:00', '2026-06-04', 1, 22, 1, 'Aceptada', 'Preferencia hacer la inspeccion en horas de la tarde');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `departamento`
--

CREATE TABLE `departamento` (
  `Id_Departamento` int(11) NOT NULL,
  `Nombre_Depart` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `departamento`
--

INSERT INTO `departamento` (`Id_Departamento`, `Nombre_Depart`) VALUES
(1, 'Santander'),
(2, 'Antioquia');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `lote`
--

CREATE TABLE `lote` (
  `Numero_Lote` int(11) NOT NULL,
  `Area_total` decimal(12,2) NOT NULL,
  `Fecha_siembra` date NOT NULL,
  `Fecha_eliminacion` date DEFAULT NULL,
  `Area_siembra` decimal(12,2) NOT NULL,
  `Estado_fenologico` varchar(50) NOT NULL,
  `Total_plantas` int(11) NOT NULL,
  `Id_lugar` int(11) NOT NULL,
  `Id_cultivo` int(11) NOT NULL COMMENT 'Referencia externa al microservicio de Cultivos'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `lote`
--

INSERT INTO `lote` (`Numero_Lote`, `Area_total`, `Fecha_siembra`, `Fecha_eliminacion`, `Area_siembra`, `Estado_fenologico`, `Total_plantas`, `Id_lugar`, `Id_cultivo`) VALUES
(2, 10.50, '2024-04-17', NULL, 8.20, 'Crecimiento', 10, 2, 2),
(6, 2.40, '2026-04-26', NULL, 2.00, 'Germinación', 10, 2, 2),
(7, 3.20, '2026-04-26', NULL, 2.20, 'Germinación', 15, 2, 3),
(8, 1.50, '2026-04-26', NULL, 1.00, 'Crecimiento', 5, 2, 3),
(9, 1.00, '2026-04-26', NULL, 1.00, 'Crecimiento', 10, 2, 3),
(11, 10.50, '2026-04-26', NULL, 8.50, 'Crecimiento', 10, 12, 3),
(12, 8.50, '2026-04-14', NULL, 8.40, 'Floración', 5, 12, 5),
(13, 10.40, '2026-04-15', NULL, 9.80, 'Maduración', 7, 12, 7),
(14, 5.20, '2026-04-12', NULL, 5.00, 'Germinación', 9, 12, 6),
(28, 5.00, '2026-05-29', NULL, 4.50, 'Siembra', 15, 19, 6),
(29, 4.20, '2026-05-28', NULL, 4.00, 'Siembra', 10, 19, 7),
(31, 5.00, '2026-05-31', NULL, 4.00, 'Crecimiento', 15, 22, 4);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `lugar_produccion`
--

CREATE TABLE `lugar_produccion` (
  `Id_lugar` int(11) NOT NULL,
  `Nombre_LugarProduccion` varchar(255) NOT NULL,
  `Id_productor` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `lugar_produccion`
--

INSERT INTO `lugar_produccion` (`Id_lugar`, `Nombre_LugarProduccion`, `Id_productor`) VALUES
(2, 'Unidad Productiva Antioquia Norte', 1),
(12, 'Unidad Productiva', 1),
(19, 'Unidad Agricola', 1),
(22, 'Unidad de floracion', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `municipio`
--

CREATE TABLE `municipio` (
  `Id_Municipio` int(11) NOT NULL,
  `Nombre_Municipio` varchar(255) NOT NULL,
  `Id_Departamento` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `municipio`
--

INSERT INTO `municipio` (`Id_Municipio`, `Nombre_Municipio`, `Id_Departamento`) VALUES
(1, 'Floridablanca', 1),
(2, 'Piedecuesta', 1),
(3, 'Girón', 1),
(4, 'Apartadó', 2),
(5, 'Marinilla', 2),
(6, 'Urrao', 2),
(7, 'Sonsón', 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `predio`
--

CREATE TABLE `predio` (
  `Id_predio` int(11) NOT NULL,
  `Nombre_predio` varchar(255) NOT NULL,
  `Area_total` decimal(12,2) NOT NULL,
  `Nombre_propietario` varchar(255) NOT NULL,
  `Coordenadas_lat` decimal(10,8) NOT NULL,
  `Coordenadas_lon` decimal(11,8) NOT NULL,
  `Estado` varchar(255) NOT NULL,
  `Id_vereda` int(11) NOT NULL,
  `Id_lugar` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `predio`
--

INSERT INTO `predio` (`Id_predio`, `Nombre_predio`, `Area_total`, `Nombre_propietario`, `Coordenadas_lat`, `Coordenadas_lon`, `Estado`, `Id_vereda`, `Id_lugar`) VALUES
(1, 'Finca La Cruz', 15.50, 'Juan David', 7.12539000, -73.11980000, 'Ocupado', 10, 22),
(2, 'Finca El Paraíso', 12.30, 'Carlos Pérez', 7.12845000, -73.11560000, 'Ocupado', 10, 22),
(3, 'Finca Los Naranjos', 18.75, 'María Gómez', 7.13012000, -73.11890000, 'Ocupado', 11, 2),
(4, 'Finca La Esperanza', 9.80, 'Luis Rodríguez', 7.12230000, -73.12150000, 'Ocupado', 9, 19),
(5, 'Finca El Progreso', 20.10, 'Ana Martínez', 7.12789000, -73.11720000, 'Ocupado', 12, 12),
(6, 'Finca San José', 14.60, 'Pedro Sánchez', 7.12456000, -73.12030000, 'Desocupado', 3, NULL),
(7, 'Finca San Manuel', 14.60, 'Pedro Sánchez', 7.12456000, -73.12030000, 'Ocupado', 11, 12);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productor`
--

CREATE TABLE `productor` (
  `Id_productor` int(11) NOT NULL,
  `Numero_identificacion` varchar(20) NOT NULL,
  `Tipo_identificacion` varchar(50) NOT NULL,
  `Primer_nombre` varchar(100) NOT NULL,
  `Segundo_nombre` varchar(100) DEFAULT NULL COMMENT 'Opcional',
  `Primer_apellido` varchar(100) NOT NULL,
  `Segundo_apellido` varchar(100) DEFAULT NULL COMMENT 'Opcional',
  `Imagen` varchar(255) NOT NULL COMMENT 'Ruta o URL de la imagen',
  `Celular` varchar(20) NOT NULL,
  `Correo` varchar(255) NOT NULL,
  `Password` varchar(255) NOT NULL COMMENT 'Debe almacenarse hasheada',
  `Estado` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `productor`
--

INSERT INTO `productor` (`Id_productor`, `Numero_identificacion`, `Tipo_identificacion`, `Primer_nombre`, `Segundo_nombre`, `Primer_apellido`, `Segundo_apellido`, `Imagen`, `Celular`, `Correo`, `Password`, `Estado`) VALUES
(1, '987654321', 'Cédula de ciudadanía', 'Juan', 'David', 'Sepulveda', '', '/uploads/productores/1780050826302-pbkhecyqsu.png', '33184606257', 'prueba2@gmail.com', '$2b$10$XkN53Ix32vRpIeJCsdhodeEMX1tAPd4wJ0jRoSsngjhXC231hwIgy', 'Activo'),
(2, '123456789', 'Cédula de ciudadanía', 'Luisa', 'Fernanda', 'Marquez', 'Monsalve', 'https://ejemplo.com/fotos/juan.jpg', '3001234567', 'luisa@gmail.com', '$2b$10$8EgXie.nRwmI8dxy4r5hmeAt/J2EDixpi7bF0GaszAg.lNuRPQjI2', 'Inactivo'),
(3, '11010452545', 'Cédula de ciudadanía', 'Juan', 'Sebastian', 'Angel', 'Rodrigez', '/uploads/productores/1780207172357-8i34reslp9y.jpg', '3015597466', 'angel@gmail.com', '$2b$10$gywWBvXgUO4U/548fXDu0On6/gF/RN/L7vViIYRvbZmmseAdSpNBa', 'Inactivo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `vereda`
--

CREATE TABLE `vereda` (
  `Id_Vereda` int(11) NOT NULL,
  `Nombre_Vereda` varchar(255) NOT NULL,
  `Id_Municipio` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `vereda`
--

INSERT INTO `vereda` (`Id_Vereda`, `Nombre_Vereda`, `Id_Municipio`) VALUES
(1, 'Casiano Bajo', 1),
(2, 'Helechales', 1),
(3, 'Plan de la Libertad', 2),
(4, 'Sevilla', 2),
(5, 'Marta', 3),
(6, 'Sogamoso', 3),
(7, 'Salsipuedes', 4),
(8, 'La Balsa', 4),
(9, 'La Esmeralda', 5),
(10, 'Cascajo Abajo', 5),
(11, 'Pavarandó', 6),
(12, 'La Encarnación', 6),
(13, 'Río Arriba', 7),
(14, 'La Holanda', 7);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `citas`
--
ALTER TABLE `citas`
  ADD PRIMARY KEY (`Id_cita`),
  ADD KEY `fk_cita_productor` (`Id_productor`),
  ADD KEY `fk_cita_lugar` (`Id_lugar`);

--
-- Indices de la tabla `departamento`
--
ALTER TABLE `departamento`
  ADD PRIMARY KEY (`Id_Departamento`);

--
-- Indices de la tabla `lote`
--
ALTER TABLE `lote`
  ADD PRIMARY KEY (`Numero_Lote`),
  ADD KEY `fk_lote_lugar` (`Id_lugar`);

--
-- Indices de la tabla `lugar_produccion`
--
ALTER TABLE `lugar_produccion`
  ADD PRIMARY KEY (`Id_lugar`),
  ADD KEY `fk_lugar_productor` (`Id_productor`);

--
-- Indices de la tabla `municipio`
--
ALTER TABLE `municipio`
  ADD PRIMARY KEY (`Id_Municipio`),
  ADD KEY `fk_municipio_departamento` (`Id_Departamento`);

--
-- Indices de la tabla `predio`
--
ALTER TABLE `predio`
  ADD PRIMARY KEY (`Id_predio`),
  ADD KEY `fk_predio_vereda` (`Id_vereda`),
  ADD KEY `fk_predio_lugar` (`Id_lugar`);

--
-- Indices de la tabla `productor`
--
ALTER TABLE `productor`
  ADD PRIMARY KEY (`Id_productor`),
  ADD UNIQUE KEY `Numero_identificacion` (`Numero_identificacion`),
  ADD UNIQUE KEY `Correo` (`Correo`);

--
-- Indices de la tabla `vereda`
--
ALTER TABLE `vereda`
  ADD PRIMARY KEY (`Id_Vereda`),
  ADD KEY `fk_vereda_municipio` (`Id_Municipio`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `citas`
--
ALTER TABLE `citas`
  MODIFY `Id_cita` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `departamento`
--
ALTER TABLE `departamento`
  MODIFY `Id_Departamento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `lote`
--
ALTER TABLE `lote`
  MODIFY `Numero_Lote` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT de la tabla `lugar_produccion`
--
ALTER TABLE `lugar_produccion`
  MODIFY `Id_lugar` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de la tabla `municipio`
--
ALTER TABLE `municipio`
  MODIFY `Id_Municipio` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `predio`
--
ALTER TABLE `predio`
  MODIFY `Id_predio` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `productor`
--
ALTER TABLE `productor`
  MODIFY `Id_productor` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `vereda`
--
ALTER TABLE `vereda`
  MODIFY `Id_Vereda` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `citas`
--
ALTER TABLE `citas`
  ADD CONSTRAINT `fk_cita_lugar` FOREIGN KEY (`Id_lugar`) REFERENCES `lugar_produccion` (`Id_lugar`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cita_productor` FOREIGN KEY (`Id_productor`) REFERENCES `productor` (`Id_productor`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `lote`
--
ALTER TABLE `lote`
  ADD CONSTRAINT `fk_lote_lugar` FOREIGN KEY (`Id_lugar`) REFERENCES `lugar_produccion` (`Id_lugar`);

--
-- Filtros para la tabla `lugar_produccion`
--
ALTER TABLE `lugar_produccion`
  ADD CONSTRAINT `fk_lugar_productor` FOREIGN KEY (`Id_productor`) REFERENCES `productor` (`Id_productor`);

--
-- Filtros para la tabla `municipio`
--
ALTER TABLE `municipio`
  ADD CONSTRAINT `fk_municipio_departamento` FOREIGN KEY (`Id_Departamento`) REFERENCES `departamento` (`Id_Departamento`);

--
-- Filtros para la tabla `predio`
--
ALTER TABLE `predio`
  ADD CONSTRAINT `fk_predio_lugar` FOREIGN KEY (`Id_lugar`) REFERENCES `lugar_produccion` (`Id_lugar`),
  ADD CONSTRAINT `fk_predio_vereda` FOREIGN KEY (`Id_vereda`) REFERENCES `vereda` (`Id_Vereda`);

--
-- Filtros para la tabla `vereda`
--
ALTER TABLE `vereda`
  ADD CONSTRAINT `fk_vereda_municipio` FOREIGN KEY (`Id_Municipio`) REFERENCES `municipio` (`Id_Municipio`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
