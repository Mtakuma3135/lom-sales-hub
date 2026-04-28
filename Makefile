SAIL := ./vendor/bin/sail

.PHONY: up stop migrate seed test work route

up:
	$(SAIL) up -d

stop:
	$(SAIL) stop

migrate:
	$(SAIL) artisan migrate --force

seed:
	$(SAIL) artisan db:seed --force

route:
	$(SAIL) artisan route:list

test:
	$(SAIL) test

work:
	$(SAIL) artisan queue:work --queue=default --sleep=1 --tries=3

