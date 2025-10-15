import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Demonstrativos } from './demonstrativos';

describe('Demonstrativos', () => {
  let component: Demonstrativos;
  let fixture: ComponentFixture<Demonstrativos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Demonstrativos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Demonstrativos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
