# Locus Helm Chart

Deploys the Locus app on Kubernetes. Single replica, single deployment, single service. Optional ingress.

## Prerequisites

- A CloudNativePG `Cluster` already running in the same namespace. The chart consumes the `<cluster>-app` secret that CNPG generates — by default it reads the `uri` key as `DATABASE_URL`.
- A container image for Locus published to a registry the cluster can pull from.

## Required values

- `database.secretName` — name of the secret holding the Postgres URI (typically `<cnpg-cluster-name>-app`).
- `image.repository` / `image.tag` — your built Locus image.

## Install

```bash
helm install locus ./helm/locus \
  -n locus \
  --create-namespace \
  --set image.repository=ghcr.io/youruser/locus \
  --set image.tag=v0.1.0 \
  --set database.secretName=locus-pg-app \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=locus.your.lan
```

Or pin everything in a `values.local.yaml` and `helm upgrade --install locus ./helm/locus -f values.local.yaml`.

## Schema bootstrap

Locus creates its table on first DB connection (idempotent `CREATE TABLE IF NOT EXISTS`). No migration job is needed.

## Extra manifests (SealedSecrets etc.)

`extraManifests` is a list of strings rendered through `tpl`. Use it to inline a SealedSecret if you ever need app-level secrets beyond the DB URI:

```yaml
extraManifests:
  - |
    apiVersion: bitnami.com/v1alpha1
    kind: SealedSecret
    metadata:
      name: {{ .Release.Name }}-extra
      namespace: {{ .Release.Namespace }}
    spec:
      encryptedData:
        SOMETHING: AgB...
```

Then reference it via `env:` in `values.yaml`:

```yaml
env:
  - name: SOMETHING
    valueFrom:
      secretKeyRef:
        name: locus-extra
        key: SOMETHING
```
