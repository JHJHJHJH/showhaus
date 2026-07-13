## References

- Nestjs config - [link](//https://www.tomray.dev/nestjs-config)
- Nestjs - [link](https://docs.nestjs.com/)
- NestJS with Postgres - [link](https://www.youtube.com/watch?v=uy05FqqJ4TM)
- TypeORM/ NestJS/ PostGis - [link](https://stackoverflow.com/questions/70530177/how-can-i-send-geojson-polygon-data-into-typeorm-nestjs)
- Debug in NestJS [link](https://stackoverflow.com/questions/49504765/debugging-nest-js-application-with-vscode)
- NestJs cannot find module app controller bug [link](https://stackoverflow.com/questions/61306329/nestjs-error-cannot-find-module-app-controller)

-NestJS/TypeORM insert nested object [link](https://stackoverflow.com/questions/54965381/how-to-insert-an-entity-with-onetomany-relation-in-nestjs)

-Deploy nestjs on AWS [link](https://www.youtube.com/watch?v=kgDx3W-qoos)
-Deploy nestjs on AWS [link](https://towardsdev.com/how-to-deploy-a-nestjs-app-to-aws-elastic-beanstalk-with-added-https-and-ci-cd-2d35c319e9f4)
-Deply nestjs on AWS using Zip file [link](https://stackoverflow.com/questions/65864374/deploying-nestjs-application-on-elastic-beanstalk)
-install npm modules Dev dependencies to dependencies [link](https://stackoverflow.com/questions/46903002/move-a-module-from-devdependencies-to-dependencies-in-npm-package-json#:~:text=So%2C%20if%20you%20need%20to,all%20to%20manage%20the%20package.)
-nestjs eb deployment notes [link](https://stackoverflow.com/questions/61750496/deploying-nestjs-to-elasticbeanstalk)

-nestjs/typeorm/postgis [link](https://stackoverflow.com/questions/67435650/storing-geojson-points-and-finding-points-within-a-given-distance-radius-nodej/67557083#67557083)

```
docker build . -t showhaus-api:${VERSION}
docker tag showhaus-api:${VERSION} showhaus-api:latest

docker tag showhaus-api:${VERSION} registry.digitalocean.com/showhaus-images/showhaus-api

docker push registry.digitalocean.com/showhaus-images/showhaus-api

kubectl rollout restart deploy showhaus-api
```
