> #### 
```ts

    1. Source Control : Git (Github, Gitlab, Bitbucket) with branch strategies
    2. Build System : npm/yarn
    3. Testing : Jest / Mocha for unit tests, SuperTest for integration test, 
                 Cypress/Playwright for E2E
    4. Code Quality : EsLint, Prettier, SonarQub
    5. security scanners : npm audit, Synk
    6. Artifact Repository : Docker registry, npm registry or binary storage
    7. Deployment : Kubernetes, Docker Swarm, AWS ECS or traditional servers
    8. Monitoring : Logging -> Winston / Pino, APM -> New Relic / Datalog, Metrics
    9. Infrastructure as Code : Terraform, CloudFormation, Ansible
    10. Orchestration : Jenkins, gitlab ci, github actions
```

> #### How would you design a multi environment CI/CD pipeline (dev/staging/prod) 
```ts

    ✔️ Branch Strategy : 
        - main ➡️ production (protected)
        - staging ➡️ staging environment
        - feature ➡️ development environment
    ✔️ Pipeline Stages : 
        - Development ➡️ On every PR
            ↪️ Lint, unit tests, build verification
        
        - Staging ➡️ On merge to staging branch 

        - Production ➡️ On merge to main
             ↪️ Smoke test post-deployment
                 
```

> #### How do you handle database migrations in Node.js CI/CD pipeline
```ts

    Migration Tool : Use dedicated tools . Ex: typeorm migrations
    Version Control : Store migration files alongside application code
    Pipeline integration : 
    --------------------
        - Dev : Run migration automatically on deployment
        - Staging : Run migrations during deployment, with rollback plan
        - Prod : 
            - Automated with verification : Run migration before app deployment
            - Rollback Strategy : Ensure each migration has a down() method 


    Best Practices:
    --------------
        - Test migration in staging first
        - Never modify production data directly
        - Backup before production migrations
        - Use transaction wrappers where possible
        - Monitor migration execution time 
    
```


> #### How would you implement a rollback strategy in your pipeline 🟡
```ts

    1. **Pre-requisites**:
        - Versioned artifacts (Docker images with tags)
        - Database migration rollback scripts
        - Health checks and monitoring

    2. **Rollback Triggers**:
        - Failed health checks post-deployment
        - Error rate threshold breaches
        - Performance degradation
        - Manual trigger for emergency

    3. **Implementation Approaches**:
        A. **Blue-Green Deployment**:
            - Keep previous version running
            - Switch back if issues detected
        
        B. **Canary with Automatic Rollback**:
            - Monitor canary metrics
            - Automatically route traffic back if failures
        
        C. **Docker/Kubernetes**:
            ```yaml
            # Kubernetes deployment strategy
            strategy:
                type: RollingUpdate
                rollingUpdate:
                maxSurge: 25%
                maxUnavailable: 25%
                # Health checks determine rollback
            ```

    4. **Pipeline Design**:
        - Separate rollback job with manual/auto trigger
        - Test rollback procedure regularly
        - Document rollback steps and responsibilities
    
```


> #### 
```ts

    1. Create migration after schema changes
    > npx prisma migrate dev --name add_user_profile

    /*-------------------
        
        ✔️ Deploy migrations to production with 🎯prisma migrate deploy🚦     
        
    -------------------*/
    
```
