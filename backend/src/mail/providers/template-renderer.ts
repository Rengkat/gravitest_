import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import * as handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';
import { htmlToText } from 'html-to-text';
import appConfig from 'src/config/appConfig';
import mailConfig from '../config/mailConfig';
import { BaseTemplateContext } from '../interfaces/template-context.interface';

interface RenderedTemplate {
  html: string;
  text: string;
}

@Injectable()
export class TemplateRendererProvider implements OnModuleInit {
  private readonly logger = new Logger(TemplateRendererProvider.name);
  private readonly cache = new Map<string, handlebars.TemplateDelegate>();
  private readonly templatesDir: string;
  private baseContext!: Omit<BaseTemplateContext, 'firstName'>;

  constructor(
    @Inject(appConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof appConfig>,

    @Inject(mailConfig.KEY)
    private readonly mailConfiguration: ConfigType<typeof mailConfig>,
  ) {
    this.templatesDir = path.join(__dirname, '..', 'templates');
    this.logger.warn(`[DEBUG] templatesDir resolved to: ${this.templatesDir}`);
  }

  async onModuleInit(): Promise<void> {
    this.baseContext = {
      appName: this.appConfiguration.name,
      appUrl: this.appConfiguration.frontendUrl,
      logoUrl: this.appConfiguration.logoUrl,
      supportEmail: this.mailConfiguration.supportAddress,
      year: new Date().getFullYear(),
    };

    await this.registerPartialsRecursively();
    this.registerHelpers();
    await this.preloadTemplatesRecursively();

    this.logger.log('Mail templates initialized successfully');
  }

  async render<T extends Partial<BaseTemplateContext>>(
    templateName: string,
    context: T,
  ): Promise<RenderedTemplate> {
    const compiled = await this.getCompiledTemplate(templateName);

    const mergedContext = {
      ...this.baseContext,
      ...context,
    };

    const html = compiled(mergedContext);

    const text = htmlToText(html, {
      wordwrap: 120,
      selectors: [
        { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
        { selector: 'img', format: 'skip' },
      ],
    });

    return { html, text };
  }

  private async getCompiledTemplate(
    templateName: string,
  ): Promise<handlebars.TemplateDelegate> {
    if (this.cache.has(templateName)) {
      return this.cache.get(templateName)!;
    }

    const filePath = path.join(this.templatesDir, `${templateName}.hbs`);

    let source: string;
    try {
      source = await fs.readFile(filePath, 'utf-8');
    } catch {
      throw new Error(`Mail template not found: ${templateName}`);
    }

    const compiled = handlebars.compile(source);
    this.cache.set(templateName, compiled);
    this.logger.debug(`Compiled template cached: ${templateName}`);

    return compiled;
  }

  private async preloadTemplatesRecursively(): Promise<void> {
    const templateFiles = await this.walkDirectory(this.templatesDir);

    for (const absoluteFilePath of templateFiles) {
      const relativePath = path.relative(this.templatesDir, absoluteFilePath);

      // Skip partials and layouts — they are registered separately
      if (
        relativePath.startsWith('partials') ||
        relativePath.startsWith('layouts')
      ) {
        continue;
      }

      if (!relativePath.endsWith('.hbs')) continue;

      const templateName = relativePath
        .replace(/\\/g, '/')
        .replace(/\.hbs$/, '');

      await this.getCompiledTemplate(templateName);
    }
  }

  private async registerPartialsRecursively(): Promise<void> {
    const partialsDir = path.join(this.templatesDir, 'partials');
    const layoutsDir = path.join(this.templatesDir, 'layouts');

    // ── Register partials under their plain name ─────────────────────────
    // e.g. partials/header.hbs  → registered as "header"
    // e.g. partials/otp-card.hbs → registered as "otp-card"
    const partialFiles = await this.walkDirectory(partialsDir, true);
    for (const absoluteFilePath of partialFiles) {
      if (!absoluteFilePath.endsWith('.hbs')) continue;

      const relativeName = path
        .relative(partialsDir, absoluteFilePath)
        .replace(/\\/g, '/')
        .replace(/\.hbs$/, '');

      const content = await fs.readFile(absoluteFilePath, 'utf-8');
      handlebars.registerPartial(relativeName, content);
      this.logger.debug(`Registered partial: ${relativeName}`);
    }

    // ── Register layouts under "layouts/<name>" ───────────────────────────
    // e.g. layouts/base.layout.hbs → registered as "layouts/base"
    // Templates call {{#> layouts/base}} so the name must match exactly.
    const layoutFiles = await this.walkDirectory(layoutsDir, true);
    for (const absoluteFilePath of layoutFiles) {
      if (!absoluteFilePath.endsWith('.hbs')) continue;

      // Strip the ".layout" suffix so "base.layout" becomes "base"
      const baseName = path
        .relative(layoutsDir, absoluteFilePath)
        .replace(/\\/g, '/')
        .replace(/\.layout\.hbs$/, '')
        .replace(/\.hbs$/, '');

      // Register as "layouts/<name>" to match {{#> layouts/base}}
      const partialName = `layouts/${baseName}`;

      const content = await fs.readFile(absoluteFilePath, 'utf-8');
      handlebars.registerPartial(partialName, content);
      this.logger.debug(`Registered layout: ${partialName}`);
    }
  }

  private async walkDirectory(dir: string, silent = false): Promise<string[]> {
    const results: string[] = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results.push(...(await this.walkDirectory(fullPath, silent)));
        } else {
          results.push(fullPath);
        }
      }
    } catch {
      if (!silent) {
        this.logger.warn(`Directory not found: ${dir}`);
      }
    }
    return results;
  }

  private registerHelpers(): void {
    handlebars.registerHelper('eq', (a, b) => a === b);

    handlebars.registerHelper('upper', (str: string) =>
      typeof str === 'string' ? str.toUpperCase() : str,
    );

    handlebars.registerHelper('formatDate', (date: string | Date) =>
      new Date(date).toLocaleString('en-NG', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'Africa/Lagos',
      }),
    );

    handlebars.registerHelper(
      'default',
      (value: any, fallback: any) => value ?? fallback,
    );
  }
}
