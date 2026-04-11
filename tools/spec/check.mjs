import fs from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const specsDir = path.join(rootDir, 'specs');
const templatesDir = path.join(rootDir, '.specify', 'templates');

const requiredSpecFiles = ['spec.md', 'plan.md', 'tasks.md', 'checklist.md'];
const requiredTemplates = [
  'spec-template.md',
  'plan-template.md',
  'tasks-template.md',
  'checklist-template.md',
];

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function listDirs(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

function isSpecFolderName(name) {
  return /^\d{4}-\d{2}-\d{2}-.+/.test(name);
}

async function main() {
  const errors = [];

  if (!(await pathExists(specsDir))) {
    errors.push('Diretório `specs/` não existe.');
  }

  if (!(await pathExists(templatesDir))) {
    errors.push('Diretório `.specify/templates/` não existe.');
  } else {
    for (const t of requiredTemplates) {
      const templatePath = path.join(templatesDir, t);
      if (!(await pathExists(templatePath))) {
        errors.push(`Template ausente: .specify/templates/${t}`);
      }
    }
  }

  if (await pathExists(specsDir)) {
    const dirs = (await listDirs(specsDir)).filter(isSpecFolderName);

    for (const d of dirs) {
      for (const f of requiredSpecFiles) {
        const full = path.join(specsDir, d, f);
        if (!(await pathExists(full))) {
          errors.push(`Spec incompleta: specs/${d}/${f} ausente`);
        }
      }

      const specPath = path.join(specsDir, d, 'spec.md');
      if (await pathExists(specPath)) {
        const spec = await fs.readFile(specPath, 'utf8');
        if (!/^Status:\s*(Draft|In Progress|Done)\s*$/m.test(spec)) {
          errors.push(`Spec inválida: specs/${d}/spec.md precisa de "Status: Draft | In Progress | Done"`);
        }
      }
    }
  }

  if (errors.length) {
    console.error('Falha na validação de specs:\n- ' + errors.join('\n- '));
    process.exit(1);
  }

  console.log('OK: specs e templates válidos.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

