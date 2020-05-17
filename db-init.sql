CREATE DATABASE IF NOT EXISTS `movienight` /*!40100 DEFAULT CHARACTER SET utf8mb4 */;

USE `movienight`;

CREATE TABLE IF NOT EXISTS `users` (
  `UserRowId` int(11) NOT NULL AUTO_INCREMENT,
  `UserId` char(36) NOT NULL,
  `Username` varchar(128) NOT NULL,
  `PassHash` varchar(128) NOT NULL,
  `Confirm` char(32) DEFAULT NULL,
  `Active` tinyint(1) NOT NULL DEFAULT '1', -- Default to 0 if you want to require email confirmation
  `Role` enum('user','admin') NOT NULL DEFAULT 'user',
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`UserId`),
  UNIQUE KEY `UserRowId_UNIQUE` (`UserRowId`),
  UNIQUE KEY `UserId_UNIQUE` (`UserId`),
  UNIQUE KEY `Username_UNIQUE` (`Username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sessions` (
  `SessionRowId` int NOT NULL AUTO_INCREMENT,
  `SessionKey` char(32) NOT NULL,
  `UserId` char(36) NOT NULL,
  `Expires` timestamp NOT NULL,
  `Active` tinyint(1) NOT NULL DEFAULT '1',
  `Created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `LastUsed` timestamp NOT NULL,
  `UserAgent` text,
  PRIMARY KEY (`SessionKey`),
  UNIQUE KEY `SessionRowId_UNIQUE` (`SessionRowId`),
  UNIQUE KEY `SessionKey_UNIQUE` (`SessionKey`),
  KEY `session_user_idx` (`UserId`),
  CONSTRAINT `session_user` FOREIGN KEY (`UserId`) REFERENCES `users` (`UserId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `theatres` (
  `TheatreRowId` int NOT NULL AUTO_INCREMENT,
  `TheatreId` char(32) NOT NULL,
  `Name` tinytext NOT NULL,
  `StartTime` TIMESTAMP NULL,
  `Host` char(36) NOT NULL,
  `VideoId` char(32) DEFAULT NULL,
  `Access` char(16) NOT NULL,
  `Active` tinyint(1) NOT NULL DEFAULT '1',
  `Created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`TheatreId`),
  UNIQUE KEY `TheatreId_UNIQUE` (`TheatreId`),
  UNIQUE KEY `TheatreRowId_UNIQUE` (`TheatreRowId`),
  KEY `theatre_owner_idx` (`Host`),
  KEY `theatre_video_idx` (`VideoId`),
  CONSTRAINT `theatre_owner` FOREIGN KEY (`Host`) REFERENCES `users` (`UserId`),
  CONSTRAINT `theatre_video` FOREIGN KEY (`VideoId`) REFERENCES `videos` (`VideoId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `videos` (
  `VideoRowId` int NOT NULL AUTO_INCREMENT,
  `VideoId` char(36) NOT NULL,
  `Title` varchar(255) NOT NULL,
  `Length` mediumint unsigned NOT NULL,
  `FileLocation` tinytext,
  `Format` tinytext NOT NULL,
  `Owner` char(36) NOT NULL,
  `Complete` tinyint(1) NOT NULL DEFAULT '0',
  `Expires` timestamp NOT NULL,
  `Created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`VideoId`),
  UNIQUE KEY `VideoId_UNIQUE` (`VideoId`),
  UNIQUE KEY `VideoTitle_UNIQUE` (`Owner`,`Title`),
  UNIQUE KEY `VideoRowId_UNIQUE` (`VideoRowId`),
  CONSTRAINT `video_owner` FOREIGN KEY (`Owner`) REFERENCES `users` (`UserId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
