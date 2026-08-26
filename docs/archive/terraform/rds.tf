resource "random_password" "db_password" {
  length  = 32
  special = false
}

resource "aws_db_instance" "main" {
  identifier        = "${local.name_prefix}-db"
  engine            = "postgres"
  engine_version    = var.db_engine_version
  instance_class    = var.db_instance_class
  allocated_storage = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_encrypted = true

  db_name  = "emnesh_workspace"
  username = "meshwork"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = var.backup_retention_days
  deletion_protection     = var.deletion_protection
  skip_final_snapshot     = false
  final_snapshot_identifier = "${local.name_prefix}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  multi_az = var.multi_az

  tags = {
    Name = "${local.name_prefix}-db"
  }
}

resource "aws_db_instance" "auth" {
  identifier        = "${local.name_prefix}-auth-db"
  engine            = "postgres"
  engine_version    = var.db_engine_version
  instance_class    = var.db_instance_class
  allocated_storage = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_encrypted = true

  db_name  = "emnesh_auth"
  username = "meshwork"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = var.backup_retention_days
  deletion_protection     = var.deletion_protection
  skip_final_snapshot     = false
  final_snapshot_identifier = "${local.name_prefix}-auth-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  multi_az = var.multi_az

  tags = {
    Name = "${local.name_prefix}-auth-db"
  }
}

resource "aws_secretsmanager_secret" "db_credentials" {
  name = "${local.name_prefix}/database/credentials"
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    host     = aws_db_instance.main.endpoint
    port     = 5432
    username = "meshwork"
    password = random_password.db_password.result
    database = "emnesh_workspace"
    auth_database = "emnesh_auth"
  })
}