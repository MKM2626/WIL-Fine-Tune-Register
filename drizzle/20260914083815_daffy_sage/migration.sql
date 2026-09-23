CREATE TABLE `analysts` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`email` varchar(254) NOT NULL,
	`name` varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customer_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`date` integer NOT NULL,
	`ruleId` integer NOT NULL,
	`customerId` integer NOT NULL,
	CONSTRAINT `fk_customer_rules_ruleId_rules_id_fk` FOREIGN KEY (`ruleId`) REFERENCES `rules`(`id`),
	CONSTRAINT `fk_customer_rules_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`),
	CONSTRAINT `unique_rule_customer` UNIQUE(`ruleId`,`customerId`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` varchar(255) NOT NULL,
	`technologyId` integer NOT NULL,
	CONSTRAINT `fk_customers_technologyId_technologies_id_fk` FOREIGN KEY (`technologyId`) REFERENCES `technologies`(`id`)
);
--> statement-breakpoint
CREATE TABLE `fine_tune_tags` (
	`fineTuneId` integer NOT NULL,
	`tagId` integer NOT NULL,
	CONSTRAINT `fk_fine_tune_tags_fineTuneId_fine_tunes_id_fk` FOREIGN KEY (`fineTuneId`) REFERENCES `fine_tunes`(`id`),
	CONSTRAINT `fk_fine_tune_tags_tagId_tags_id_fk` FOREIGN KEY (`tagId`) REFERENCES `tags`(`id`)
);
--> statement-breakpoint
CREATE TABLE `fine_tunes` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`previous_fine_tune_id` integer,
	`version` integer NOT NULL,
	`date` integer NOT NULL,
	`expiryDate` integer,
	`customerRuleId` integer NOT NULL,
	`globalId` varchar(36),
	`name` varchar(72),
	`fineTune` text NOT NULL,
	`comment` text,
	`analystId` integer NOT NULL,
	`finalised` integer NOT NULL,
	`finalisedAnalystId` integer,
	CONSTRAINT `fk_fine_tunes_previous_fine_tune_id_fine_tunes_id_fk` FOREIGN KEY (`previous_fine_tune_id`) REFERENCES `fine_tunes`(`id`),
	CONSTRAINT `fk_fine_tunes_customerRuleId_customer_rules_id_fk` FOREIGN KEY (`customerRuleId`) REFERENCES `customer_rules`(`id`),
	CONSTRAINT `fk_fine_tunes_analystId_analysts_id_fk` FOREIGN KEY (`analystId`) REFERENCES `analysts`(`id`),
	CONSTRAINT `fk_fine_tunes_finalisedAnalystId_analysts_id_fk` FOREIGN KEY (`finalisedAnalystId`) REFERENCES `analysts`(`id`),
	CONSTRAINT `unique_customer_rule_version` UNIQUE(`customerRuleId`,`version`)
);
--> statement-breakpoint
CREATE TABLE `rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` varchar(72) NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE `technologies` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` varchar(255) NOT NULL
);
