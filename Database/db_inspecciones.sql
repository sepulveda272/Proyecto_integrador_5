-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 31-05-2026 a las 20:28:59
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
-- Base de datos: `db_inspecciones`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `funcionario_ica`
--

CREATE TABLE `funcionario_ica` (
  `Id_funcionario` int(11) NOT NULL,
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
-- Volcado de datos para la tabla `funcionario_ica`
--

INSERT INTO `funcionario_ica` (`Id_funcionario`, `Numero_identificacion`, `Tipo_identificacion`, `Primer_nombre`, `Segundo_nombre`, `Primer_apellido`, `Segundo_apellido`, `Imagen`, `Celular`, `Correo`, `Password`, `Estado`) VALUES
(1, '52876543', 'Cédula de ciudadanía', 'Laura', 'Milena', 'Figueroa', 'Torres', 'https://i.pravatar.cc/150?img=47', '3157896543', 'laura.figueroa@ica.gov.co', '$2b$10$zJQIiMSaISBPvPX0vDkr/eSgFkNdvIGKHx7IuAbRUKopezTLrQowS', 'Activo'),
(2, '71234567', 'Cédula de ciudadanía', 'Andrés', NULL, 'Ospina', 'Vargas', 'https://i.pravatar.cc/150?img=60', '3189012345', 'andres.ospina@ica.gov.co', '$2b$10$zJQIiMSaISBPvPX0vDkr/eSgFkNdvIGKHx7IuAbRUKopezTLrQowS', 'Activo'),
(3, '1063154877', 'Cédula de ciudadanía', 'Leynner', '', 'Savedra', '', '/uploads/funcionarios/1780049668747-gbvctuabqy.jpg', '3104808259', 'leynner@gmail.com', '$2b$10$S5N2uuNJGKFFz/h7qx5OIO7/Q37fhdVsdSIZyvp4lF4yeVZYE57MW', 'Inactivo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inspeccion_fitosanitario`
--

CREATE TABLE `inspeccion_fitosanitario` (
  `Id_inspeccion` int(11) NOT NULL,
  `Plantas_revisadas` int(11) DEFAULT NULL,
  `Plantas_afectadas` int(11) DEFAULT NULL,
  `Fecha_inspeccion` date NOT NULL,
  `Nivel_alerta` int(11) DEFAULT NULL COMMENT 'Puede ser un ENUM o tabla de catálogo, pero aquí un INT',
  `Id_tecnico` int(11) NOT NULL,
  `Id_lugar` int(11) NOT NULL COMMENT 'Este ID hace referencia a Lugar_produccion en db_ubicaciones. No es una FOREIGN KEY física.',
  `Estado` varchar(20) NOT NULL DEFAULT 'Pendiente' COMMENT 'Pendiente | Completado',
  `Detalle_lotes` longtext DEFAULT NULL COMMENT 'JSON con detalle por lote: plantasContadas, plagasPorPlanta, estaCompleta'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `inspeccion_fitosanitario`
--

INSERT INTO `inspeccion_fitosanitario` (`Id_inspeccion`, `Plantas_revisadas`, `Plantas_afectadas`, `Fecha_inspeccion`, `Nivel_alerta`, `Id_tecnico`, `Id_lugar`, `Estado`, `Detalle_lotes`) VALUES
(5, 0, 0, '2026-06-06', 0, 1, 2, 'Pendiente', NULL),
(6, 0, 0, '2026-05-27', 0, 1, 4, 'Pendiente', NULL),
(7, 0, 0, '2026-06-05', 0, 1, 2, 'Pendiente', NULL),
(8, 1693, 0, '2026-05-28', 0, 1, 4, 'Pendiente', NULL),
(9, 31, 10, '2026-05-30', 3, 1, 12, 'Completado', '{\"LOTE-11\":{\"plantasContadas\":10,\"plagasPorPlanta\":{},\"estaCompleta\":true},\"LOTE-12\":{\"plantasContadas\":5,\"plagasPorPlanta\":{\"5\":[8,7]},\"estaCompleta\":true},\"LOTE-13\":{\"plantasContadas\":7,\"plagasPorPlanta\":{\"1\":[4],\"4\":[2,4],\"6\":[4,2],\"7\":[2]},\"estaCompleta\":true},\"LOTE-14\":{\"plantasContadas\":9,\"plagasPorPlanta\":{\"5\":[4],\"6\":[4],\"7\":[7],\"8\":[4],\"9\":[7]},\"estaCompleta\":true}}'),
(17, 25, 4, '2026-06-01', 4, 1, 19, 'Completado', '{\"LOTE-28\":{\"plantasContadas\":15,\"plagasPorPlanta\":{\"3\":[4],\"5\":[4,7],\"8\":[4,7]},\"estaCompleta\":true},\"LOTE-29\":{\"plantasContadas\":10,\"plagasPorPlanta\":{\"1\":[4,2]},\"estaCompleta\":true}}');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `observaciones`
--

CREATE TABLE `observaciones` (
  `Id_observacion` int(11) NOT NULL,
  `Fecha_observacion` datetime NOT NULL,
  `Observaciones` text NOT NULL,
  `Id_inspeccion` int(11) NOT NULL,
  `Id_funcionario` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `observaciones`
--

INSERT INTO `observaciones` (`Id_observacion`, `Fecha_observacion`, `Observaciones`, `Id_inspeccion`, `Id_funcionario`) VALUES
(6, '2026-05-28 05:37:33', 'cuide mas sus cultivos para que los pueda exportar', 9, 1),
(7, '2026-05-29 05:44:58', 'muy bien pasaste la inspeccion', 17, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tecnico_oficial`
--

CREATE TABLE `tecnico_oficial` (
  `Id_tecnico` int(11) NOT NULL,
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
-- Volcado de datos para la tabla `tecnico_oficial`
--

INSERT INTO `tecnico_oficial` (`Id_tecnico`, `Numero_identificacion`, `Tipo_identificacion`, `Primer_nombre`, `Segundo_nombre`, `Primer_apellido`, `Segundo_apellido`, `Imagen`, `Celular`, `Correo`, `Password`, `Estado`) VALUES
(1, '1098765432', 'Cédula de ciudadanía', 'Yeison', 'Andrés', 'Suárez', 'Ramírez', 'https://i.pravatar.cc/150?img=11', '3001234567', 'yeison.suarez@sifex.gov.co', '$2b$10$zJQIiMSaISBPvPX0vDkr/eSgFkNdvIGKHx7IuAbRUKopezTLrQowS', 'Activo'),
(2, '1075432198', 'Cédula de ciudadanía', 'Paola', NULL, 'Suárez', 'Rincón', 'https://i.pravatar.cc/150?img=25', '3112345678', 'paola.suarez@sifex.gov.co', '$2b$10$zJQIiMSaISBPvPX0vDkr/eSgFkNdvIGKHx7IuAbRUKopezTLrQowS', 'Activo'),
(3, '79654321', 'Cédula de ciudadanía', 'Carlos', 'Alberto', 'Martínez', 'Gómez', 'https://i.pravatar.cc/150?img=33', '3205678901', 'carlos.martinez@sifex.gov.co', '$2b$10$zJQIiMSaISBPvPX0vDkr/eSgFkNdvIGKHx7IuAbRUKopezTLrQowS', 'Activo'),
(4, '123456789', 'Cédula de ciudadanía', 'Juan', 'Carlos', 'Pérez', 'Gómez', 'https://ejemplo.com/fotos/juan.jpg', '3001234567', 'juan.perez@correo.com', '$2b$10$smANobvHv9MorAaMAae2JuDTU4.QulCa6Y1JRfeKVvqlwVDQug94O', 'Inactivo');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `funcionario_ica`
--
ALTER TABLE `funcionario_ica`
  ADD PRIMARY KEY (`Id_funcionario`),
  ADD UNIQUE KEY `Numero_identificacion` (`Numero_identificacion`),
  ADD UNIQUE KEY `Correo` (`Correo`);

--
-- Indices de la tabla `inspeccion_fitosanitario`
--
ALTER TABLE `inspeccion_fitosanitario`
  ADD PRIMARY KEY (`Id_inspeccion`),
  ADD KEY `fk_inspeccion_tecnico` (`Id_tecnico`);

--
-- Indices de la tabla `observaciones`
--
ALTER TABLE `observaciones`
  ADD PRIMARY KEY (`Id_observacion`),
  ADD KEY `fk_observaciones_inspeccion` (`Id_inspeccion`),
  ADD KEY `fk_observaciones_funcionario` (`Id_funcionario`);

--
-- Indices de la tabla `tecnico_oficial`
--
ALTER TABLE `tecnico_oficial`
  ADD PRIMARY KEY (`Id_tecnico`),
  ADD UNIQUE KEY `Numero_identificacion` (`Numero_identificacion`),
  ADD UNIQUE KEY `Correo` (`Correo`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `funcionario_ica`
--
ALTER TABLE `funcionario_ica`
  MODIFY `Id_funcionario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `inspeccion_fitosanitario`
--
ALTER TABLE `inspeccion_fitosanitario`
  MODIFY `Id_inspeccion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de la tabla `observaciones`
--
ALTER TABLE `observaciones`
  MODIFY `Id_observacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `tecnico_oficial`
--
ALTER TABLE `tecnico_oficial`
  MODIFY `Id_tecnico` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `inspeccion_fitosanitario`
--
ALTER TABLE `inspeccion_fitosanitario`
  ADD CONSTRAINT `fk_inspeccion_tecnico` FOREIGN KEY (`Id_tecnico`) REFERENCES `tecnico_oficial` (`Id_tecnico`);

--
-- Filtros para la tabla `observaciones`
--
ALTER TABLE `observaciones`
  ADD CONSTRAINT `fk_observaciones_funcionario` FOREIGN KEY (`Id_funcionario`) REFERENCES `funcionario_ica` (`Id_funcionario`),
  ADD CONSTRAINT `fk_observaciones_inspeccion` FOREIGN KEY (`Id_inspeccion`) REFERENCES `inspeccion_fitosanitario` (`Id_inspeccion`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
