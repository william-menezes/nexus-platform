import fs from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);

function getFlagValue(flagName) {
  const flagIndex = args.indexOf(flagName);
  if (flagIndex === -1) return null;
  const value = args[flagIndex + 1];
  if (!value || value.startsWith('--')) return null;
  return value;
}

function getSlug() {
  const firstNonFlag = args.find((a) => !a.startsWith('--'));
  return firstNonFlag ?? null;
}

function defaultDate() {
  return new Date().toISOString().slice(0, 10);
}

function sanitizeSlug(raw) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-_.]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const slugRaw = getSlug();
if (!slugRaw) {
  console.error('Uso: npm run spec:new -- <slug> --title "Título da feature"');
  process.exit(1);
}

const slug = sanitizeSlug(slugRaw);
if (!slug) {
  console.error('Slug inválido.');
  process.exit(1);
}

const title = getFlagValue('--title') ?? slugRaw;
const createdAt = getFlagValue('--date') ?? defaultDate();

const rootDir = process.cwd();
const templatesDir = path.join(rootDir, '.specify', 'templates');
const specsDir = path.join(rootDir, 'specs');
const specFolderName = `${createdAt}-${slug}`;
const specDir = path.join(specsDir, specFolderName);

async function readTemplate(fileName) {
  const fullPath = path.join(templatesDir, fileName);
  return fs.readFile(fullPath, 'utf8');
}

function applyReplacements(contents) {
  return contents
    .replaceAll('[TÍTULO DA FEATURE]', title)
    .replaceAll('[FEATURE NAME]', title)
    .replaceAll('[YYYY-MM-DD]', createdAt)
    .replaceAll('Criada em: [YYYY-MM-DD]', `Criada em: ${createdAt}`)
    .replaceAll('Criada em: [DATE]', `Criada em: ${createdAt}`)
    .replaceAll('Criada em: [YYYY-MM-DD]', `Criada em: ${createdAt}`);
}

async function main() {
  await fs.mkdir(specDir, { recursive: true });

  const [specTemplate, planTemplate, tasksTemplate, checklistTemplate] =
    await Promise.all([
      readTemplate('spec-template.md'),
      readTemplate('plan-template.md'),
      readTemplate('tasks-template.md'),
      readTemplate('checklist-template.md'),
    ]);

  const specMd = applyReplacements(specTemplate)
    .replace(/^Status:.*$/m, 'Status: Draft')
    .replace(/^Owner:.*$/m, 'Owner: [definir]')
    .replace(/^Criada em:.*$/m, `Criada em: ${createdAt}`)
    .replace(/^Links:.*$/m, 'Links: [issue/PR/design/doc]');

  const planMd = applyReplacements(planTemplate).replaceAll('`spec.md`', '`spec.md`');
  const tasksMd = applyReplacements(tasksTemplate);
  const checklistMd = applyReplacements(checklistTemplate);

  await Promise.all([
    fs.writeFile(path.join(specDir, 'spec.md'), specMd, 'utf8'),
    fs.writeFile(path.join(specDir, 'plan.md'), planMd, 'utf8'),
    fs.writeFile(path.join(specDir, 'tasks.md'), tasksMd, 'utf8'),
    fs.writeFile(path.join(specDir, 'checklist.md'), checklistMd, 'utf8'),
  ]);

  console.log(`Spec criada em: specs/${specFolderName}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

