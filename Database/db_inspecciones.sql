-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 11-05-2026 a las 10:09:24
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

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inspeccion_fitosanitario`
--

CREATE TABLE `inspeccion_fitosanitario` (
  `Id_inspeccion` int(11) NOT NULL,
  `Plantas_revisadas` int(11) NOT NULL DEFAULT 0,
  `Plantas_afectadas` int(11) NOT NULL DEFAULT 0,
  `Fecha_inspeccion` date NOT NULL,
  `Nivel_alerta` int(11) NOT NULL COMMENT 'Puede ser un ENUM o tabla de catálogo, pero aquí un INT',
  `Id_tecnico` int(11) NOT NULL,
  `Id_lugar` int(11) NOT NULL COMMENT 'Este ID hace referencia a Lugar_produccion en db_ubicaciones. No es una FOREIGN KEY física.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

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
  MODIFY `Id_funcionario` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `inspeccion_fitosanitario`
--
ALTER TABLE `inspeccion_fitosanitario`
  MODIFY `Id_inspeccion` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `observaciones`
--
ALTER TABLE `observaciones`
  MODIFY `Id_observacion` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tecnico_oficial`
--
ALTER TABLE `tecnico_oficial`
  MODIFY `Id_tecnico` int(11) NOT NULL AUTO_INCREMENT;

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
