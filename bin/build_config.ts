import * as cdk from 'aws-cdk-lib';

export interface BuildConfig {
    readonly environment: string
    readonly region: string    
    readonly logLevel: string
    readonly accountId: string
    readonly buildDate: string    
}

export function getConfig(app: cdk.App): BuildConfig{
    const ENV_INPUT = 'env'
    const env = app.node.tryGetContext(ENV_INPUT)
    if (!env) {
        throw new Error(`-c ${ENV_INPUT} variable missing from CDK command`)
    }

    const REGION_INPUT = 'region'
    const region = app.node.tryGetContext(REGION_INPUT)
    if (!region) {
        throw new Error(`-c ${REGION_INPUT} variable missing from CDK command`)
    }

    const configId = `${env}_${region}`
    const cdkContextConfig = app.node.tryGetContext(configId)
    if (!cdkContextConfig) {
        throw new Error(`No configuration matching ${configId}`)
    }
    return buildConfig(env, cdkContextConfig);
}

function buildConfig(env: any, cdkContextConfig: any): BuildConfig {
    return {
        environment: env,
        region: cdkContextConfig.region,
        logLevel: cdkContextConfig.logLevel,
        accountId: cdkContextConfig.accountId,
        buildDate: getBuildDate()
    }
}

function getBuildDate() {
    const now = new Date()
    return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
}
